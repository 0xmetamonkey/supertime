import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { auth, currentUser } from '@clerk/nextjs/server';
import { resolveUsername } from '../../../actions';

/** KV key that stores the set of usernames whose chats this user has "deleted" */
function deletedChatsKey(username: string) {
  return `chat:deleted:${username.toLowerCase()}`;
}

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

    // Fetch the set of deleted chat partners for this user
    const deletedSet = await kv.smembers(deletedChatsKey(username)) as string[];
    const deletedLower = new Set((deletedSet || []).map(u => u.toLowerCase()));

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

          // Skip conversations the user has soft-deleted
          if (deletedLower.has(otherUser.toLowerCase())) continue;
          
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

/**
 * Soft-delete a conversation for the calling user.
 * Body: { username: string, recipient: string }
 * This adds the recipient to the user's deleted-chats set so it's
 * filtered out on future inbox GETs. The underlying data is untouched.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username, recipient } = await req.json();
    if (!username || !recipient) {
      return NextResponse.json({ error: 'Missing username or recipient' }, { status: 400 });
    }

    await kv.sadd(deletedChatsKey(username.toLowerCase()), recipient.toLowerCase());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inbox API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
