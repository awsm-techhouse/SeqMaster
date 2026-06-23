import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { sendTransactionalReceiptEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const rawBodyText = await request.text();

    if (!rawBodyText || rawBodyText.trim() === "") {
      console.warn('Webhook POST received empty body - acknowledging without processing');
      return NextResponse.json({ status: "verified" }, { status: 200 });
    }

    // Try to parse JSON first, fallback to URL-encoded form parsing
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        body = JSON.parse(rawBodyText);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(rawBodyText);
        body = Object.fromEntries(params.entries());
      } else {
        // last resort: try JSON.parse, otherwise leave empty
        body = JSON.parse(rawBodyText);
      }
    } catch (parseErr) {
      console.error('Failed to parse webhook body:', parseErr, 'content-type:', contentType);
      // Acknowledge the webhook to avoid repeated retries from upstream
      return NextResponse.json({ status: 'acknowledged' }, { status: 200 });
    }

    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id || typeof order_id !== 'string') {
      console.warn('Webhook payload missing or invalid order_id - acknowledging without error', { order_id });
      return NextResponse.json({ status: 'missing_order_id' }, { status: 200 });
    }

    const validOrderIdPattern = /^(SEQ|INV)-\d+-\d+$/;
    if (!validOrderIdPattern.test(order_id)) {
      console.warn('Webhook received malformed order_id - ignoring webhook', { order_id });
      return NextResponse.json({ status: 'invalid_order_id' }, { status: 200 });
    }

    let isSettled = false;
    let finalDatabaseStatus = 'pending';

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        finalDatabaseStatus = 'settlement';
        isSettled = true;
      }
    } else if (transaction_status === 'expire') {
      finalDatabaseStatus = 'expired';
    } else if (['cancel', 'deny'].includes(transaction_status)) {
      finalDatabaseStatus = 'failed';
    }

    // 1. Try updating retail orders first
    const { data: updatedOrderData, error: dbError } = await supabaseAdmin
      .from('orders')
      .update({ status: finalDatabaseStatus })
      .eq('id', order_id)
      .select('*, products(*)');

    if (dbError) throw dbError;

    let orderRecord: any = null;

    if (updatedOrderData && updatedOrderData.length > 0) {
      orderRecord = Array.isArray(updatedOrderData) ? updatedOrderData[0] : updatedOrderData;
    }

    // 2. If retail order not found, try updating jasa_invoices (service invoices)
    let invoiceRecord: any = null;
    if (!orderRecord) {
      const { data: updatedInvoiceData, error: invErr } = await supabaseAdmin
        .from('jasa_invoices')
        .update({ status: finalDatabaseStatus })
        .eq('id', order_id)
        .select('*, jasa_orders(*)');

      if (invErr) throw invErr;

      if (updatedInvoiceData && updatedInvoiceData.length > 0) {
        invoiceRecord = Array.isArray(updatedInvoiceData) ? updatedInvoiceData[0] : updatedInvoiceData;
      }
    }

    // 3. Send emails or process download links for retail orders
    if (isSettled && orderRecord) {
      let secureDownloadUrl = '#';

      if (orderRecord.products?.master_file_key) {
        try {
          const downloadCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: orderRecord.products.master_file_key,
          });
          secureDownloadUrl = await getSignedUrl(r2Client, downloadCommand, { expiresIn: 172800 });
        } catch (r2Err) {
          console.error("R2 sign link failed in webhook thread:", r2Err);
        }
      }

      // Tautan pendaftaran manual untuk disisipkan ke email pengingat
      const registerFallbackLink = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')}/auth`;

      await sendTransactionalReceiptEmail({
        customerName: orderRecord.customer_name,
        customerEmail: orderRecord.customer_email,
        orderId: orderRecord.id,
        productTitle: orderRecord.products?.title || 'Premium Sequencer Patch',
        totalAmount: orderRecord.total_amount,
        downloadUrl: secureDownloadUrl,
        activationUrl: orderRecord.requires_activation ? registerFallbackLink : undefined
      });
    }

    return NextResponse.json({ success: true, status: finalDatabaseStatus });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Critical collision in webhook payment automation engine:', error);
    return NextResponse.json({ error: message || 'Internal Hook Core Exception' }, { status: 500 });
  }
}