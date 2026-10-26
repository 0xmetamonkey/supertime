import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface VerifiedPayment {
  payment: any;
  order: any;
  // Authoritative amount in whole INR as recorded on the server-created order.
  amountInRupees: number;
}

export function getRazorpayInstance(): Razorpay {
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are not configured');
  }
  return new Razorpay({ key_id, key_secret });
}

/**
 * SECURITY: verifies the checkout signature AND binds the payment to the
 * server-created order. Never trust client-supplied amounts/product metadata —
 * everything fulfilled downstream must come from the returned order entity.
 */
export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifiedPayment> {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error('Missing payment verification fields');
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay secret missing');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpaySignature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('INVALID_SIGNATURE');
  }

  const instance = getRazorpayInstance();

  // Confirm with Razorpay's API that this payment really captured against this order.
  const payment = await instance.payments.fetch(razorpayPaymentId);
  if (!payment || payment.order_id !== razorpayOrderId) {
    throw new Error('PAYMENT_ORDER_MISMATCH');
  }
  if (payment.status !== 'captured') {
    throw new Error('PAYMENT_NOT_CAPTURED');
  }

  const order = await instance.orders.fetch(razorpayOrderId);
  if (!order || order.id !== razorpayOrderId) {
    throw new Error('ORDER_NOT_FOUND');
  }

  return {
    payment,
    order,
    amountInRupees: Math.floor(Number(order.amount) / 100),
  };
}
