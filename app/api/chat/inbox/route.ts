import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getIdentity, matchesIdentity } from '@/app/lib/identity';

/** KV key that stores the set of usernames whose chats this user has "deleted" */
function deletedChatsKey(username: string) {
  return `chat:deleted:${username.toLowerCase()}`;
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getIdentity();
    if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let username = searchParams.get('username') || '';

    // A requested username must belong to the session; otherwise default to the session's own.
    if (username) {
      if (!matchesIdentity(username, identity)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      username = identity.usernames[0];
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
    const identity = await getIdentity();
    if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { username, recipient, recipients, deleteAll } = body;

    // The owner is always taken from the session; any client-supplied username must match it.
    if (username && !matchesIdentity(username, identity)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = identity.usernames[0];

    if (deleteAll) {
      const keys = await kv.keys('chat:dm:*');
      const toDelete: string[] = [];
      for (const key of keys) {
        const parts = key.split(':');
        const dmIndex = parts.indexOf('dm');
        if (dmIndex !== -1 && parts.length >= dmIndex + 3) {
          const u1 = parts[dmIndex + 1];
          const u2 = parts[dmIndex + 2];
          if (u1 === targetUser.toLowerCase()) toDelete.push(u2.toLowerCase());
          else if (u2 === targetUser.toLowerCase()) toDelete.push(u1.toLowerCase());
        }
      }
      if (toDelete.length > 0) {
        for (const item of toDelete) {
          await kv.sadd(deletedChatsKey(targetUser), item);
        }
      }
      return NextResponse.json({ success: true, count: toDelete.length });
    }

    if (Array.isArray(recipients) && recipients.length > 0) {
      for (const r of recipients) {
        if (typeof r === 'string' && r.trim()) {
          await kv.sadd(deletedChatsKey(targetUser), r.toLowerCase().trim());
        }
      }
      return NextResponse.json({ success: true, count: recipients.length });
    }

    if (!recipient) {
      return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
    }

    await kv.sadd(deletedChatsKey(targetUser), recipient.toLowerCase());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inbox API] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
