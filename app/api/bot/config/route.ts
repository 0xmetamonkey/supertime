import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config: any = await kv.get(`bot_config:${user.id}`);

  // Try to resolve profile picture if connected
  let profilePicture = null;
  try {
    // We need to find the Page ID first. 
    // Usually we'd store the pageId in the config or we can find it by looking up tokens.
    // Let's check if we have a linked page for this user.
    // Iterating keys is slow/not possible effectively in KV, so we'll store pageId in config moving forward.
    const pageId = config?.instagramPageId;
    if (pageId) {
      const token: string | null = await kv.get(`insta_token:${pageId}`);
      if (token && token !== 'CONNECTED') {
        const igRes = await fetch(`https://graph.instagram.com/v21.0/${pageId}?fields=profile_pic&access_token=${token}`);
        const igData = await igRes.json();
        if (igData.profile_pic) {
          profilePicture = igData.profile_pic;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching PFP:', e);
  }

  return NextResponse.json({
    ...(config || {
      enabled: true,
      keywords: ['price', 'join', 'how'],
      response: "Hey! Thanks for reaching out. You can join my session here: supertime.wtf",
      instagramToken: ''
    }),
    profilePicture
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { instagramToken, isUserToken, rules, ...configData } = data;

    let finalToken = instagramToken;
    let resolvedPageId = null;

    // Handle Professional OAuth Flow (Token Exchange)
    if (instagramToken && isUserToken) {
      if (configData.resolvedPageId) {
        // Bypass FB Graph if we already resolved the IG User ID via Native Login
        resolvedPageId = configData.resolvedPageId;
        console.log(`Native IG Auth provided Account ID: ${resolvedPageId}. Bypassing FB Graph.`);
      } else {
        console.log('--- Professional OAuth: Exchanging User Token ---');
        try {
          // 1. Get Pages (Accounts) with Instagram Business Accounts linked
          const accountsRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,access_token,instagram_business_account&access_token=${instagramToken}`);
          const accountsData = await accountsRes.json();
          console.log(`Found ${accountsData.data?.length || 0} Pages associated with this user.`);
          if (accountsData.data && accountsData.data.length > 0) {
            // Find the first page with a linked Instagram account
            const linkedAccount = accountsData.data.find((acc: any) => acc.instagram_business_account);

            if (linkedAccount) {
              const shortLivedPageToken = linkedAccount.access_token;
              resolvedPageId = linkedAccount.id;

              console.log(`Found Page ${resolvedPageId} with IG linked. Exchanging for Long-Lived Token...`);

              // 2. Exchange for Long-Lived Page Access Token
              const appId = process.env.INSTAGRAM_APP_ID;
              const appSecret = process.env.INSTAGRAM_APP_SECRET;

              const exchangeRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedPageToken}`);
              const exchangeData = await exchangeRes.json();

              if (exchangeData.access_token) {
                finalToken = exchangeData.access_token;
                console.log('Successfully generated Long-Lived Token.');
              }
            } else {
              console.warn('No Instagram Business Account linked to any Facebook Page found.');
              console.log('Full Accounts Data:', JSON.stringify(accountsData.data, null, 2));
            }
          } else {
            console.warn('No Facebook Pages found for this user.');
          }
        } catch (e) {
          console.error('Error in professional token exchange:', e);
        }
      }
    }

    // Sanitize rules: lowercase and trimmed keywords
    const sanitizedRules = (rules || []).map((rule: any) => ({
      ...rule,
      keywords: (rule.keywords || [])
        .map((kw: string) => kw.toLowerCase().trim())
        .filter((kw: string) => kw.length > 0)
    }));

    // Save user's configuration
    await kv.set(`bot_config:${user.id}`, {
      ...configData,
      rules: sanitizedRules,
      instagramToken: finalToken ? 'CONNECTED' : '', // Store status, not the raw token here for security in config
      instagramPageId: resolvedPageId || configData.instagramPageId,
      updatedAt: new Date().toISOString()
    });

    // Link Page ID and Store Token securely in separate KV keys
    if (resolvedPageId && finalToken) {
      await kv.set(`insta_page_to_user:${resolvedPageId}`, user.id);
      await kv.set(`insta_token:${resolvedPageId}`, finalToken);
      console.log(`Linked Page ${resolvedPageId} to User ${user.id}`);
    } else if (finalToken && !isUserToken) {
      // Manual Token Fallback (for testing)
      try {
        const meRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${finalToken}`);
        const meData = await meRes.json();
        if (meData.id) {
          await kv.set(`insta_page_to_user:${meData.id}`, user.id);
          await kv.set(`insta_token:${meData.id}`, finalToken);
        }
      } catch (e) { }
    }

    // Update global for webhook backwards compatibility (if needed)
    await kv.set('bot_config:global', { ...configData, rules: rules, enabled: true });

    return NextResponse.json({ success: true, isConnected: !!finalToken });
  } catch (error) {
    console.error('Error saving bot config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
