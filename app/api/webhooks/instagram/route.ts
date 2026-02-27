import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('--- Incoming Webhook Verification ---');
  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Challenge:', challenge);

  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  console.log('Expected Token:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new Response(challenge, { status: 200 });
  }

  console.error('WEBHOOK_VERIFICATION_FAILED: Token mismatch or invalid mode');
  return new Response('Forbidden', { status: 403 });
}

async function sendReply(recipientId: string, text: string, optionalToken?: string) {
  const PAGE_ACCESS_TOKEN = optionalToken || process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!PAGE_ACCESS_TOKEN) {
    console.warn('MISSING INSTAGRAM_PAGE_ACCESS_TOKEN: Auto-reply skipped.');
    return;
  }

  // Native IG Tokens must use graph.instagram.com, not graph.facebook.com
  const url = `https://graph.instagram.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const payload = {
    recipient: { id: recipientId },
    message: { text: text },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) {
      console.error('Error sending Instagram reply:', data.error);
    } else {
      console.log('Successfully sent Instagram reply:', data);
    }
  } catch (error) {
    console.error('Fetch error sending Instagram reply:', error);
  }
}

// Helper to process keyword matching and sending
async function processAutoReply(pageId: string, senderId: string, text: string, origin: 'dm' | 'comment') {
  const startTime = Date.now();
  console.log(`[PERF] Start processAutoReply for ${origin} | ${new Date().toISOString()}`);

  // 1. Resolve User ID from Page ID
  const userId = await kv.get(`insta_page_to_user:${pageId}`);
  console.log(`[PERF] Resolved User ID: ${Date.now() - startTime}ms`);

  // 2. Fetch user configuration in parallel
  let config: any = null;
  let customToken: string | undefined = undefined;

  if (userId) {
    const [configRes, tokenRes] = await Promise.all([
      kv.get(`bot_config:${userId}`),
      kv.get(`insta_token:${pageId}`)
    ]);
    config = configRes;
    customToken = tokenRes as string;
    console.log(`[PERF] Fetched Config & Token: ${Date.now() - startTime}ms`);
  } else {
    // Fallback to global config for developers
    config = await kv.get('bot_config:global');
    console.log(`[PERF] Fetched Global Config: ${Date.now() - startTime}ms`);
  }

  if (!config || !config.enabled) {
    console.log('BOT DISABLED or NO CONFIG: Auto-reply skipped.');
    return;
  }

  const rules: any[] = config.rules || [];

  // Backward compatibility: If no rules but old format exists
  if (rules.length === 0 && (config.keywords || config.response)) {
    rules.push({
      keywords: config.keywords || [],
      response: config.response || "",
      triggerType: 'dm' // Legacy was essentially DM
    });
  }

  let matchFound = false;

  for (const rule of rules) {
    const keywords: string[] = rule.keywords || [];
    const responseTemplate = rule.response || "";
    const triggerType = rule.triggerType || 'dm';

    if (triggerType !== origin) continue;

    const isMatch = keywords.some(kw => kw && text.includes(kw.toLowerCase()));

    if (isMatch) {
      console.log(`[AUTO-REPLY TRACE] MATCH FOUND: Sending response.`);
      const sendStart = Date.now();
      await sendReply(senderId, responseTemplate, customToken);
      console.log(`[PERF] sendReply completed: ${Date.now() - sendStart}ms`);
      matchFound = true;
      break;
    }
  }

  console.log(`[PERF] Total processAutoReply execution: ${Date.now() - startTime}ms`);

  if (!matchFound) {
    console.log('NO MATCH: Auto-reply ignored.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('\n--- INCOMING INSTAGRAM WEBHOOK PUSH ---');
    console.log(JSON.stringify(body, null, 2));

    // The new 2024 Native API might send object: 'instagram' or something else entirely.
    if (body.object === 'instagram' || body.object === 'page' || body.entry) {
      const entries = body.entry || [];
      for (const entry of entries) {
        const pageId = entry.id;

        // --- PART 1: Handle DMs (messaging) ---
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              const senderId = messagingEvent.sender.id;
              const messageText = messagingEvent.message.text?.toLowerCase() || '';
              console.log(`[DM TRACE] From ${senderId} to Page ${pageId}: "${messageText}"`);
              await processAutoReply(pageId, senderId, messageText, 'dm');
            }
          }
        }

        // --- PART 2: Handle Comments (changes) ---
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              const commentData = change.value;
              const senderId = commentData.from.id;
              const commentText = commentData.text?.toLowerCase() || '';
              const commentId = commentData.id;

              // Prevent self-replies
              if (senderId === pageId) continue;

              console.log(`[COMMENT TRACE] From ${commentData.from.id} on Page ${pageId} (ID: ${commentId}): "${commentText}"`);
              await processAutoReply(pageId, senderId, commentText, 'comment');
            }
          }
        }
      }
      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ error: 'Not an instagram object' }, { status: 404 });
  } catch (error) {
    console.error('Error processing Instagram webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
