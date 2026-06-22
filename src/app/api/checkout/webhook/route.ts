import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS }
});

export async function POST(request: Request) {
  try {
    const notificationJson = await request.json();
    const orderId = notificationJson.order_id;
    const transactionStatus = notificationJson.transaction_status;

    let targetStatus = 'pending';
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      targetStatus = 'settlement';
    } else if (['deny', 'expire', 'cancel'].includes(transactionStatus)) {
      targetStatus = 'failed';
    }

    if (targetStatus === 'settlement') {
      if (orderId.startsWith('JASA-')) {
        const { data: jasaData, error: jasaError } = await supabase
          .from('jasa_orders')
          .update({ payment_status: 'settlement' })
          .eq('id', orderId.replace('JASA-', ''))
          .select()
          .single();
          
        if (jasaError) throw jasaError;
      } else {
        const { data: orderData, error: updateError } = await supabase
          .from('orders')
          .update({ status: 'settlement' })
          .eq('id', orderId)
          .select()
          .single();

        if (updateError) throw updateError;

        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: orderData.customer_email,
          subject: '📦 Berkas Master Sequencer Anda Siap Diunduh!',
          html: `<p>Halo ${orderData.customer_name},</p>
                 <p>Terima kasih, pembayaran berhasil diverifikasi. Silakan masuk ke dashboard akun untuk mengunduh produk digital Anda:</p>
                 <a href="${dashboardUrl}">${dashboardUrl}</a>`
        });
      }
    }

    return NextResponse.json({ status: 'Synchronized' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}