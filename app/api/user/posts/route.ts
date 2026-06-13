import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

    const key = `user_posts:${username.toLowerCase()}`;
    const posts = await kv.get<any[]>(key) || [];
    
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const username = await kv.get<string>(`user:${email}:username`);
    if (!username) return NextResponse.json({ error: 'No username claimed' }, { status: 400 });

    const body = await req.json();
    const { action, post, postId } = body;
    const key = `user_posts:${username.toLowerCase()}`;
    
    let posts = await kv.get<any[]>(key) || [];

    if (action === 'upsert') {
      const existingIndex = posts.findIndex(p => p.id === post.id);
      if (existingIndex >= 0) {
        posts[existingIndex] = { ...posts[existingIndex], ...post, updatedAt: Date.now() };
      } else {
        posts.unshift({ ...post, createdAt: Date.now() });
      }
    } else if (action === 'delete') {
      posts = posts.filter(p => p.id !== postId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await kv.set(key, posts);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error modifying posts:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
