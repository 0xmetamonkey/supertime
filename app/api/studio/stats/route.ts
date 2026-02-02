import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    totalCalls: 0,
    totalMinutes: 0,
    totalEarnings: 0
  });
}
