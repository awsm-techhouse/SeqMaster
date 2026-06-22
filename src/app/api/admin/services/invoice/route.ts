import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendUserInvoiceNotificationEmail } from '@/lib/email';
// @ts-ignore
import MidtransClient from 'midtrans-client';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// FIX INSTANSIASI: Memastikan constructor Snap Midtrans terpanggil dengan benar di berbagai env compiler
const MidtransSnapConstructor = MidtransClient.Snap || (MidtransClient as any).default?.Snap;
const snap = new MidtransSnapConstructor({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      invoice_id,
      jasa_order_id, 
      amount, 
      description, 
      customer_name, 
      customer_email, 
      whatsapp_number, 
      project_title 
    } = body;

    const numericAmount = Number(amount);

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

    const uniqueInvoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    // 1. Daftarkan ke server Midtrans Snap
    const parameter = {
      transaction_details: { order_id: uniqueInvoiceId, gross_amount: numericAmount },
      customer_details: { first_name: customer_name, email: customer_email, phone: whatsapp_number }
    };
    const transaction = await snap.createTransaction(parameter);

    // 2. Simpan entri tagihan baru ke database
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

    // 3. BLAST EMAIL: Kirim notifikasi tagihan baru ke email klien
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
      console.log(`Email notification successfully dispatched to ${customer_email}`);
    } catch (emailErr) {
      console.error("SMTP Alert email failed to dispatch but invoice database is locked:", emailErr);
    }

    return NextResponse.json({ success: true, mode: 'create', data });
  } catch (error: any) {
    console.error('Invoicing processor engine crash:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}