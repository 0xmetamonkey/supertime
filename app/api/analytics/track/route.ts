import { NextResponse } from 'next/server';
import { trackEvent, AnalyticsEvent } from '@/app/lib/analytics';
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
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
