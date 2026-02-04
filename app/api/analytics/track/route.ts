import { NextResponse } from 'next/server';
import { trackEvent, AnalyticsEvent } from '@/app/lib/analytics';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { event, username, metadata } = await req.json();

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    await trackEvent(username, event as AnalyticsEvent, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track API Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
