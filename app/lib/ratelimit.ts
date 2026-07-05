import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

export const chatRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'rl:chat',
});

export const tipRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:tip',
});

export const paymentRatelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:payment',
});
