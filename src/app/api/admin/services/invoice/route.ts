import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendUserInvoiceNotificationEmail } from '@/lib/email';
import { Snap } from 'midtrans-client';
import { midtransPaymentRedirectUrl, midtransSnapConfig } from '@/lib/midtrans';

const snap = new Snap(midtransSnapConfig);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface InvoiceRequestBody {
  invoice_id?: string;
  jasa_order_id?: string | number;
  amount?: string | number;
  description?: string;
  customer_name?: string;
  customer_email?: string;
  whatsapp_number?: string;
  project_title?: string;
  action?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InvoiceRequestBody;
    const { 
      invoice_id,
      jasa_order_id, 
      amount, 
      description, 
      customer_name, 
      customer_email, 
      whatsapp_number, 
      project_title,
      action
    } = body;

    const numericAmount = Number(amount);

    if (invoice_id && action === 'cancel') {
      const { error: cancelError } = await supabaseAdmin
        .from('jasa_invoices')
        .update({ status: 'expired' })
        .eq('id', invoice_id);

      if (cancelError) throw cancelError;
      return NextResponse.json({ success: true, mode: 'cancel' });
    }

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

    if (!jasa_order_id) {
      return NextResponse.json({ error: 'Missing jasa_order_id for invoice creation' }, { status: 400 });
    }

    const { data: existingOpenInvoice, error: openInvoiceError } = await supabaseAdmin
      .from('jasa_invoices')
      .select('id, status')
      .eq('jasa_order_id', jasa_order_id)
      .in('status', ['pending'])
      .limit(1);

    if (openInvoiceError) throw openInvoiceError;
    if (existingOpenInvoice && existingOpenInvoice.length > 0) {
      return NextResponse.json({
        error: 'Masih ada invoice termin yang belum selesai. Selesaikan invoice aktif terlebih dahulu sebelum menerbitkan invoice baru.'
      }, { status: 400 });
    }

    const uniqueInvoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    // 1. Daftarkan ke server Midtrans Snap
    const parameter = {
      transaction_details: { order_id: uniqueInvoiceId, gross_amount: numericAmount },
      customer_details: { first_name: customer_name, email: customer_email, phone: whatsapp_number }
    };
    const transaction = await snap.createTransaction(parameter);

    // 2. Simpan entri tagihan baru ke database
    const invoiceOrderId = typeof jasa_order_id === 'string' && jasa_order_id.trim() !== '' && !isNaN(Number(jasa_order_id))
      ? Number(jasa_order_id)
      : jasa_order_id;

    const { data, error: dbError } = await supabaseAdmin
      .from('jasa_invoices')
      .insert([{
        id: uniqueInvoiceId,
        jasa_order_id: invoiceOrderId,
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
      if (customer_name && customer_email) {
        await sendUserInvoiceNotificationEmail({
          customerName: customer_name,
          customerEmail: customer_email,
          projectTitle: project_title || 'Custom Audio Production',
          invoiceId: uniqueInvoiceId,
          termDescription: description || 'Payment invoice',
          amount: numericAmount,
          paymentUrl: midtransPaymentRedirectUrl(transaction.token)
        });
        console.log(`Email notification successfully dispatched to ${customer_email}`);
      }
    } catch (emailErr) {
      console.error("SMTP Alert email failed to dispatch but invoice database is locked:", emailErr);
    }

    return NextResponse.json({ success: true, mode: 'create', data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Invoicing processor engine crash:', error);
    return NextResponse.json({ error: message || 'Internal Server Error' }, { status: 500 });
  }
}