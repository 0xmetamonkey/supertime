import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth, currentUser } from '@clerk/nextjs/server';
import { resolveUsername } from '../../../actions';

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    let username = searchParams.get('username') || '';

    if (!username) {
      let email = (sessionClaims as any)?.email || '';
      if (!email) {
        const user = await currentUser();
        email = user?.emailAddresses?.[0]?.emailAddress || '';
      }

      const resolvedUsername = email ? await resolveUsername(email) : null;
      username = resolvedUsername || (email ? email.split('@')[0] : '');
    }
    
    username = username.toLowerCase();

    // Scan for all DM keys
    const keys = await kv.keys('chat:dm:*');
    
    const conversations = [];
    
    for (const key of keys) {
      const parts = key.split(':');
      const dmIndex = parts.indexOf('dm');
      
      if (dmIndex !== -1 && parts.length >= dmIndex + 3) {
        const u1 = parts[dmIndex + 1];
        const u2 = parts[dmIndex + 2];
        
        if (u1 === username || u2 === username) {
          const otherUser = u1 === username ? u2 : u1;
          
          // Get last message
          const msgs = await kv.get<any[]>(key);
          if (msgs && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            
            let otherUserProfileImage = '';
            try {
              const otherUserEmail = await kv.get<string>(`owner:${otherUser.toLowerCase()}`);
              if (otherUserEmail) {
                const img = await kv.get<string>(`user:${otherUserEmail}:profileImage`);
                if (img) otherUserProfileImage = img;
              }
            } catch (e) {
              console.error('Error fetching inbox profile image:', e);
            }

            conversations.push({
              with: otherUser,
              lastMessage: lastMsg.text,
              timestamp: lastMsg.timestamp,
              from: lastMsg.from,
              profileImage: otherUserProfileImage
            });
          }
        }
      }
    }
    
    conversations.sort((a, b) => b.timestamp - a.timestamp);
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[Inbox API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 });
  }
}
