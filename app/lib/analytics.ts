import { kv } from "@vercel/kv";

export type AnalyticsEvent = "view" | "call_start" | "call_end" | "earning";

export async function trackEvent(username: string, event: AnalyticsEvent, metadata: any = {}) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `stats:${username}:${date}`;

  try {
    // Increment daily count
    await kv.hincrby(key, event, 1);

    // If it's an earning event, add to total earnings for the day
    if (event === "earning" && metadata.amount) {
      await kv.hincrby(key, "earnings_amount", Math.floor(metadata.amount));
    }

    // Track total historical count
    await kv.hincrby(`stats:${username}:total`, event, 1);

    if (event === "earning" && metadata.amount) {
      await kv.hincrby(`stats:${username}:total`, "earnings_amount", Math.floor(metadata.amount));
    }

  } catch (error) {
    console.error("Analytics Error:", error);
  }
}

export async function getStats(username: string) {
  try {
    const total = await kv.hgetall(`stats:${username}:total`) || {};

    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayStats = await kv.hgetall(`stats:${username}:${dateString}`) || {};
      days.push({
        date: dateString,
        views: parseInt(dayStats.view as string || "0"),
        earnings: parseInt(dayStats.earnings_amount as string || "0"),
      });
    }

    return {
      total,
      history: days
    };
  } catch (error) {
    console.error("Fetch Stats Error:", error);
    return { total: {}, history: [] };
  }
}
