import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from '@clerk/nextjs/server';
import Razorpay from 'razorpay';

// GET — fetch fundraiser
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

  if (!process.env.KV_URL) return NextResponse.json({ error: 'KV not configured' }, { status: 500 });

  const fundraiser = await kv.get(`fundraise:${username.toLowerCase()}`);
  if (!fundraiser) return NextResponse.json({ found: false });

  // Get supporters
  const supporters: any[] = (await kv.get(`fundraise:${username.toLowerCase()}:supporters`)) || [];

  return NextResponse.json({ found: true, fundraiser, supporters });
}

// POST — create/update fundraiser OR donate
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (!process.env.KV_URL) return NextResponse.json({ error: 'KV not configured' }, { status: 500 });

  // CREATE / UPDATE fundraiser
  if (action === 'upsert') {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const username = await kv.get(`user:${email}:username`);
    if (!username) return NextResponse.json({ error: 'No username claimed' }, { status: 400 });

    const { title, story, videoUrl, imageUrl, goalAmount, verificationDoc, isActive } = body;
    if (!title || !goalAmount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const existing: any = await kv.get(`fundraise:${username}`) || {};
    const fundraiser = {
      ...existing,
      title,
      story: story || '',
      videoUrl: videoUrl || '',
      imageUrl: imageUrl || '',
      verificationDoc: verificationDoc || existing.verificationDoc || '',
      goalAmount: Number(goalAmount),
      raisedAmount: existing.raisedAmount || 0,
      donorCount: existing.donorCount || 0,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerEmail: email,
      username: username,
      isActive: isActive !== undefined ? isActive : (existing.isActive || false),
    };

    await kv.set(`fundraise:${username}`, fundraiser);
    return NextResponse.json({ success: true, fundraiser });
  }

  // DONATE — create Razorpay order
  if (action === 'create-order') {
    const { amount, username } = body;
    if (!amount || amount < 1 || !username) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `fund_${username}_${Date.now()}`,
      notes: { type: 'fundraiser', username },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  }

  // VERIFY donation
  if (action === 'verify') {
    const { username, amount, donorName, razorpay_payment_id } = body;
    if (!username || !amount) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    const key = `fundraise:${username.toLowerCase()}`;
    const fundraiser: any = await kv.get(key);
    if (!fundraiser) return NextResponse.json({ error: 'Fundraiser not found' }, { status: 404 });

    // Update raised amount
    fundraiser.raisedAmount = (fundraiser.raisedAmount || 0) + Number(amount);
    fundraiser.donorCount = (fundraiser.donorCount || 0) + 1;
    await kv.set(key, fundraiser);

    // Add to supporters list
    const supportersKey = `fundraise:${username.toLowerCase()}:supporters`;
    const supporters: any[] = (await kv.get(supportersKey)) || [];
    supporters.unshift({
      name: donorName || 'Anonymous',
      amount: Number(amount),
      paymentId: razorpay_payment_id || null,
      date: new Date().toISOString(),
    });
    // Keep last 100 supporters
    if (supporters.length > 100) supporters.length = 100;
    await kv.set(supportersKey, supporters);

    return NextResponse.json({ success: true, fundraiser });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
