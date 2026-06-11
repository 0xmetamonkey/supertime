import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { kv } from '@vercel/kv';
import { ADMIN_EMAILS } from '../../../config';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const adminEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    // Verify Admin
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, body, audience } = await req.json();

    if (!subject || !body || !audience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured on the server.' }, { status: 500 });
    }

    if (!process.env.KV_URL) {
      return NextResponse.json({ error: 'KV database not configured.' }, { status: 500 });
    }

    // Fetch all users to filter them by audience
    const ownerKeys = await kv.keys('owner:*');
    const verifiedKeys = await kv.keys('user:*:verified');

    // We only need emails and roles for broadcasting
    const usersMap = new Map();

    const getUser = (email: string) => {
      if (!usersMap.has(email)) {
        usersMap.set(email, { email, role: 'Fan', isVerified: false });
      }
      return usersMap.get(email);
    };

    // Mark creators
    for (const key of ownerKeys) {
      const email = await kv.get<string>(key);
      if (email) {
        getUser(email).role = 'Creator';
      }
    }

    // Mark verified
    for (const key of verifiedKeys) {
      const email = key.replace('user:', '').replace(':verified', '');
      const isVerified = await kv.get(key);
      if (isVerified) {
        getUser(email).isVerified = true;
      }
    }

    // Filter by audience
    const allUsers = Array.from(usersMap.values());
    let targetEmails: string[] = [];

    if (audience === 'all') {
      targetEmails = allUsers.map(u => u.email);
    } else if (audience === 'creators') {
      targetEmails = allUsers.filter(u => u.role === 'Creator').map(u => u.email);
    } else if (audience === 'fans') {
      targetEmails = allUsers.filter(u => u.role === 'Fan').map(u => u.email);
    } else if (audience === 'unverified') {
      targetEmails = allUsers.filter(u => u.role === 'Creator' && !u.isVerified).map(u => u.email);
    }

    if (targetEmails.length === 0) {
      return NextResponse.json({ error: 'No users found for this audience segment.' }, { status: 400 });
    }

    // Batch emails
    // Resend batch sending (max 100 per batch)
    // We will chunk the array into sizes of 100
    const chunkSize = 100;
    for (let i = 0; i < targetEmails.length; i += chunkSize) {
      const chunk = targetEmails.slice(i, i + chunkSize);
      
      const payload = chunk.map(email => ({
        from: 'Supertime <hello@supertime.wtf>', // Make sure this domain is verified in Resend!
        to: [email],
        subject: subject,
        html: body,
      }));

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('[Resend API] Batch Error:', errorData);
        return NextResponse.json({ error: errorData.message || 'Resend API failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: targetEmails.length });
  } catch (error: any) {
    console.error('Broadcast Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
