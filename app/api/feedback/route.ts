import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || 'anonymous@supertime.app';

    const body = await req.json();
    const { details, fileUrl } = body;

    if (!details) {
      return NextResponse.json({ error: 'Details are required' }, { status: 400 });
    }

    const feedbackPayload = {
      id: Date.now().toString(),
      email,
      details,
      fileUrl: fileUrl || null,
      timestamp: new Date().toISOString(),
      status: 'open'
    };

    // Store in KV as a list of feedbacks
    await kv.lpush('global_feedback', feedbackPayload);

    return NextResponse.json({ success: true, id: feedbackPayload.id });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
