import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from "../../../auth";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const blob = await put(filename, request.body as ReadableStream, {
    access: 'public',
  });

  return NextResponse.json(blob);
}
