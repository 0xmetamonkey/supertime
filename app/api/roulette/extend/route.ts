import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { processSplitPayment, getDetailedWallet } from '@/app/lib/economics';
import { kv } from '@vercel/kv';

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    let callerEmail = (sessionClaims as any)?.email;

    if (!callerEmail) {
      const user = await currentUser();
      callerEmail = user?.emailAddresses?.[0]?.emailAddress;
    }

    if (!callerEmail) {
      callerEmail = 'guest@supertime.app';
    }

    const body = await req.json();
    const { creatorEmail, creatorUsername, amount } = body;

    const creditAmount = Math.max(1, Math.round(Number(amount) || 10));
    const normalizedCaller = callerEmail.toLowerCase();

    let targetEmail = creatorEmail;
    if (!targetEmail && creatorUsername && process.env.KV_URL) {
      targetEmail = await kv.get(`owner:${creatorUsername.toLowerCase()}`);
    }

    // Local dev mock store fallback
    if (!process.env.KV_URL) {
      const current = global.mockWalletStore?.get(normalizedCaller) ?? 500;
      if (current < creditAmount) {
        return NextResponse.json({ error: 'Insufficient tokens in wallet' }, { status: 402 });
      }
      const newBal = current - creditAmount;
      if (!global.mockWalletStore) global.mockWalletStore = new Map();
      global.mockWalletStore.set(normalizedCaller, newBal);

      if (targetEmail) {
        const targetBal = global.mockWalletStore.get(targetEmail.toLowerCase()) ?? 0;
        global.mockWalletStore.set(targetEmail.toLowerCase(), targetBal + Math.floor(creditAmount * 0.8));
      }

      return NextResponse.json({
        success: true,
        amountDeducted: creditAmount,
        speakerShare: Math.floor(creditAmount * 0.8),
        platformShare: Math.floor(creditAmount * 0.2),
        newBalance: newBal,
      });
    }

    // Production Vercel KV flow
    if (targetEmail) {
      // Creator matched: 80/20 split payment
      const result = await processSplitPayment(normalizedCaller, targetEmail, creditAmount);
      return NextResponse.json({
        success: true,
        amountDeducted: creditAmount,
        speakerShare: result.speakerShare,
        platformShare: result.platformShare,
        newBalance: result.balance,
      });
    } else {
      // Peer-to-peer / Platform extension: deduct from caller wallet
      const currentFullBalance = (await kv.get<number>(`balance:${normalizedCaller}`)) ?? 0;
      if (currentFullBalance < creditAmount) {
        return NextResponse.json({ error: 'Insufficient tokens in wallet' }, { status: 402 });
      }
      const finalSenderBalance = currentFullBalance - creditAmount;
      await kv.set(`balance:${normalizedCaller}`, finalSenderBalance);

      const totalPlatformRevenue = (await kv.get<number>(`platform:revenue`)) ?? 0;
      await kv.set(`platform:revenue`, totalPlatformRevenue + creditAmount);

      return NextResponse.json({
        success: true,
        amountDeducted: creditAmount,
        speakerShare: 0,
        platformShare: creditAmount,
        newBalance: finalSenderBalance,
      });
    }
  } catch (error: any) {
    console.error('[Supertalks Extend API Error]:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Payment processing failed' },
      { status: 400 }
    );
  }
}
