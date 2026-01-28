import { NextResponse } from 'next/server';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomName = searchParams.get('roomName');

  if (!roomName) {
    return NextResponse.json({ error: 'Missing roomName' }, { status: 400 });
  }

  // If no API key, we can't create private rooms, so we return a placeholder or error
  if (!DAILY_API_KEY) {
    console.warn('DAILY_API_KEY not found in environment variables.');
    // For demo purposes, we can return a public room pattern if allowed, 
    // but Daily usually requires an API key for dynamic room creation.
    return NextResponse.json({
      error: 'Daily.co API Key is missing. Please add DAILY_API_KEY to your .env'
    }, { status: 500 });
  }

  try {
    // 1. Try to fetch the room first
    const fetchRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (fetchRes.ok) {
      const room = await fetchRes.json();
      return NextResponse.json({ url: room.url });
    }

    // 2. If it doesn't exist, create it
    const createRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          enable_knocking: false, // Make it easy to join
          exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        },
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json();
      throw new Error(errorData.info || 'Failed to create room');
    }

    const newRoom = await createRes.json();
    return NextResponse.json({ url: newRoom.url });

  } catch (error: any) {
    console.error('Daily API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
