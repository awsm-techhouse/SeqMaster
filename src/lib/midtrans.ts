export const midtransIsProduction =
  process.env.NEXT_PUBLIC_MIDTRANS_USE_PRODUCTION === 'true' ||
  process.env.MIDTRANS_USE_PRODUCTION === 'true';

export const midtransSnapScriptUrl = midtransIsProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

export const midtransPaymentRedirectUrl = (token: string) =>
  midtransIsProduction
    ? `https://checkout.midtrans.com/v1/payment-redirect/${token}`
    : `https://checkout.sandbox.midtrans.com/v1/payment-redirect/${token}`;

export const midtransStatusApiUrl = (orderId: string) =>
  midtransIsProduction
    ? `https://api.midtrans.com/v2/${orderId}/status`
    : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

export const midtransSnapConfig = {
  isProduction: midtransIsProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
};
