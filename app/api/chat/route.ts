import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getBotResponse } from '../../lib/bot-logic';
import { chatRatelimit } from '../../lib/ratelimit';

// Team chat API — persistent messages in KV, realtime via Ably
const TEAM_CHAT_KEY = 'team:chat:supertime';
const MAX_MESSAGES = 200;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { id, message, from, fromEmail, to, type, meta, status } = await req.json();

    if ((!message && !type) || !from) {
      return NextResponse.json({ error: 'Missing message or from' }, { status: 400 });
    }

    const identifier = fromEmail || req.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = await chatRatelimit.limit(identifier);
    if (!success) {
      return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 });
    }

    const newMessage: Record<string, any> = {
      id: id || Math.random().toString(36).slice(2),
      from,
      fromEmail: fromEmail || '',
      text: message || '',
      timestamp: Date.now(),
      status: status || 'sent',
      ...(type && { type }),
      ...(meta && { meta }),
    };


    // Determine target key and channel
    let chatKey = TEAM_CHAT_KEY;
    let channelName = 'team:supertime';

    if (to) {
      // Deterministic key for DMs: dm:chat:user1:user2 (sorted)
      const participants = [from.toLowerCase(), to.toLowerCase()].sort();
      chatKey = `chat:dm:${participants.join(':')}`;
      channelName = `dm:${participants.join(':')}`;
    }

    const existing = await kv.get<any[]>(chatKey) || [];
    const updated = [...existing.slice(-(MAX_MESSAGES - 1)), newMessage];

    await kv.set(chatKey, updated, { ex: TTL_SECONDS });

    // Publish to Ably for real-time delivery
    try {
      const apiKey = process.env.ABLY_API_KEY;
      if (apiKey) {
        const ably = new (await import('ably')).Rest(apiKey);
        const channel = ably.channels.get(channelName);
        await channel.publish('message', newMessage);

        // If it's a DM, also publish a notification to the recipient's personal channel
        if (to) {
          const notifyChannel = ably.channels.get(`user:${to.toLowerCase()}`);
          await notifyChannel.publish('notification', {
            type: 'dm',
            ...newMessage
          });

          // FIREBASE PUSH NOTIFICATION
          try {
            const pushToken = await kv.get(`fcm_token:${to.toLowerCase()}`);
            if (pushToken) {
              const { messaging } = await import('../../lib/firebase-admin');
              if (messaging) {
                await messaging.send({
                  token: pushToken as string,
                  notification: {
                    title: `New message from @${from}`,
                    body: message.length > 50 ? message.substring(0, 50) + '...' : message,
                  },
                  data: {
                    type: 'chat-message',
                    from,
                  }
                });
                console.log(`[Chat API] Successfully pushed FCM to ${to}`);
              } else {
                console.warn('[Chat API] FCM push skipped: Firebase Admin is not initialized.');
              }
            }
          } catch (fcmErr) {
             console.error('[Chat API] FCM push failed:', fcmErr);
          }
        }
      }
    } catch (e) {
      console.error('[Chat API] Ably publish failed:', e);
    }

    // --- Bot Hook ---
    if (message.includes('@Supertime AI')) {
      (async () => { // Async block so we don't block the user's response
        try {
          const botReply = await getBotResponse(message);
          const botMessage = {
            id: 'bot-' + Math.random().toString(36).slice(2),
            from: 'Supertime AI',
            fromEmail: 'bot@supertime.wtf',
            text: botReply,
            timestamp: Date.now() + 100 // Slight offset for sorting
          };

          // Persist bot reply to KV
          const current = await kv.get<any[]>(chatKey) || [];
          const updatedWithBot = [...current.slice(-(MAX_MESSAGES - 1)), botMessage];
          await kv.set(chatKey, updatedWithBot, { ex: TTL_SECONDS });

          // Publish bot reply to Ably
          const apiKey = process.env.ABLY_API_KEY;
          if (apiKey) {
            const ably = new (await import('ably')).Rest(apiKey);
            await ably.channels.get(channelName).publish('message', botMessage);
          }
        } catch (botErr) {
          console.error('[Chat API] Bot reply error:', botErr);
        }
      })();
    }

    return NextResponse.json({ success: true, messageId: newMessage.id });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get('since') || '0');
    const channel = searchParams.get('channel');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Determine target key
    let chatKey = TEAM_CHAT_KEY;
    
    if (channel && channel !== 'team:supertime') {
      chatKey = `chat:${channel}`;
    } else if (from && to) {
      const participants = [from.toLowerCase(), to.toLowerCase()].sort();
      chatKey = `chat:dm:${participants.join(':')}`;
    }

    const messages = await kv.get<any[]>(chatKey) || [];
    
    // Mark received messages as opened
    let hasUpdates = false;
    const updatedMessages = messages.map(m => {
      if (from && to && m.from.toLowerCase() === to.toLowerCase() && m.status !== 'opened') {
        hasUpdates = true;
        return { ...m, status: 'opened' };
      }
      return m;
    });

    if (hasUpdates) {
      await kv.set(chatKey, updatedMessages, { ex: 60 * 60 * 24 * 7 });
    }

    const filtered = since ? updatedMessages.filter(m => m.timestamp > since) : updatedMessages;

    return NextResponse.json({ messages: filtered });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}
