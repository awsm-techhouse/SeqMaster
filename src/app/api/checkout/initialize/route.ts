import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Snap } from 'midtrans-client';
import { midtransSnapConfig } from '@/lib/midtrans';

const snap = new Snap(midtransSnapConfig);

export async function POST(request: Request) {
  try {
    const { product_id, customer_name, customer_email, whatsapp_number, amount, user_id } = await request.json();
    const uniqueOrderId = `SEQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Cek apakah item ini sudah dimiliki oleh email yang sama
    const { data: duplicateOrder, error: duplicateError } = await supabase
      .from('orders')
      .select('id')
      .eq('product_id', product_id)
      .eq('customer_email', customer_email)
      .eq('status', 'settlement')
      .limit(1);

    if (duplicateError) throw duplicateError;
    if (duplicateOrder && duplicateOrder.length > 0) {
      return NextResponse.json({ error: 'Anda sudah memiliki item ini. Silakan cek dashboard Anda.' }, { status: 400 });
    }

    // 2. Inisialisasi token transaksi ke Midtrans Server
    const parameter = {
      transaction_details: { order_id: uniqueOrderId, gross_amount: amount },
      customer_details: { first_name: customer_name, email: customer_email, phone: whatsapp_number }
    };

    const transaction = await snap.createTransaction(parameter);

    const { data: existingUserOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_email', customer_email)
      .eq('status', 'settlement')
      .limit(1);

    const isNewCustomerNode = !existingUserOrder || existingUserOrder.length === 0;

    // 3. Simpan record order ke database beserta token snap-nya
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
        requires_activation: isNewCustomerNode,
        payment_token: transaction.token // Token disimpan aman di DB
      }]);

    if (dbError) throw dbError;

    return NextResponse.json({ token: transaction.token, orderId: uniqueOrderId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Checkout internal handler error:', error);
    return NextResponse.json({ error: message || 'Internal Server Error' }, { status: 500 });
  }
}