import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// @ts-ignore
import MidtransClient from 'midtrans-client';

const snap = new MidtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export async function POST(request: Request) {
  try {
    const { product_id, customer_name, customer_email, whatsapp_number, amount, user_id } = await request.json();
    const uniqueOrderId = `SEQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Jalankan pembuatan token transaksi ke server Midtrans terlebih dahulu
    const parameter = {
      transaction_details: { order_id: uniqueOrderId, gross_amount: amount },
      customer_details: { first_name: customer_name, email: customer_email, phone: whatsapp_number }
    };
    const transaction = await snap.createTransaction(parameter);

    // 2. Deteksi status keaktifan email konsumen
    const { data: existingUserOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_email', customer_email)
      .eq('status', 'settlement')
      .limit(1);

    const isNewCustomerNode = !existingUserOrder || existingUserOrder.length === 0;

    // 3. INJEKSI PERBAIKAN: Masukkan transaction.token langsung ke kolom payment_token Supabase
    const { error: dbError } = await supabase
      .from('orders')
      .insert([{
        id: uniqueOrderId,
        product_id,
        user_id: user_id || null,
        customer_name,
        customer_email,
        whatsapp_number,
        total_amount: amount,
        status: 'pending',
        type: 'retail',
        requires_activation: isNewCustomerNode,
        payment_token: transaction.token // Mengunci token secara permanen di database server
      }]);

    if (dbError) throw dbError;

    return NextResponse.json({ token: transaction.token, orderId: uniqueOrderId });
  } catch (error: any) {
    console.error('Checkout initialization failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}