import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendUserInvoiceNotificationEmail } from '@/lib/email';
// @ts-ignore
import MidtransClient from 'midtrans-client';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const snap = new MidtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      invoice_id, // Opsional, diisi hanya jika mode UPDATE termin lama
      jasa_order_id, 
      amount, 
      description, 
      customer_name, 
      customer_email, 
      whatsapp_number, 
      project_title 
    } = body;

    const numericAmount = Number(amount);

    // MODE A: JIKA INVOICE_ID TERSEDIA -> LAKUKAN UPDATE DATA LAMA
    if (invoice_id) {
      const { error: updateError } = await supabaseAdmin
        .from('jasa_invoices')
        .update({
          amount: numericAmount,
          description: description
        })
        .eq('id', invoice_id);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, mode: 'update' });
    }

    // MODE B: JIKA INVOICE_ID KOSONG -> TERBITKAN TAGIHAN TERMIN BARU
    const uniqueInvoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    // 1. Daftarkan partial partial milestone ini ke server Midtrans Snap
    const parameter = {
      transaction_details: { order_id: uniqueInvoiceId, gross_amount: numericAmount },
      customer_details: { first_name: customer_name, email: customer_email, phone: whatsapp_number }
    };
    const transaction = await snap.createTransaction(parameter);

    // 2. Kunci entri tagihan baru ke dalam tabel jasa_invoices (Gunakan Number() untuk BIGINT compatibility)
    const { data, error: dbError } = await supabaseAdmin
      .from('jasa_invoices')
      .insert([{
        id: uniqueInvoiceId,
        jasa_order_id: Number(jasa_order_id),
        amount: numericAmount,
        description,
        status: 'pending',
        payment_token: transaction.token
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. BLAST EMAIL: Kirim notifikasi tagihan baru ke email klien via Nodemailer SMTP Gmail
    try {
      await sendUserInvoiceNotificationEmail({
        customerName: customer_name,
        customerEmail: customer_email,
        projectTitle: project_title || 'Custom Audio Production',
        invoiceId: uniqueInvoiceId,
        termDescription: description,
        amount: numericAmount,
        paymentUrl: `https://checkout.sandbox.midtrans.com/v1/payment-redirect/${transaction.token}`
      });
    } catch (emailErr) {
      console.error("SMTP Alert email failed to dispatch but invoice is locked:", emailErr);
    }

    return NextResponse.json({ success: true, mode: 'create', data });
  } catch (error: any) {
    console.error('Invoicing processor engine crash:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}