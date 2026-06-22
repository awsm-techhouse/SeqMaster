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
      return NextResponse.json({ status: "verified" }, { status: 200 });
    }

    const body = JSON.parse(rawBodyText);
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing identifier order_id' }, { status: 400 });
    }

    let isSettled = false;
    let finalDatabaseStatus = 'pending';

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        finalDatabaseStatus = 'settlement';
        isSettled = true;
      }
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      finalDatabaseStatus = 'failed';
    }

    const { data: updatedOrder, error: dbError } = await supabaseAdmin
      .from('orders')
      .update({ status: finalDatabaseStatus })
      .eq('id', order_id)
      .select('*, products(*)')
      .single();

    if (dbError) throw dbError;

    if (isSettled && updatedOrder) {
      let secureDownloadUrl = '#';
      let activationLink: string | undefined = undefined;

      if (updatedOrder.products?.master_file_key) {
        try {
          const downloadCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: updatedOrder.products.master_file_key,
          });
          secureDownloadUrl = await getSignedUrl(r2Client, downloadCommand, { expiresIn: 172800 });
        } catch (r2Err) {
          console.error("R2 sign link failed in webhook thread:", r2Err);
        }
      }

      // ISOLASI MUTLAK: Menggunakan try-catch khusus agar error pendaftaran tidak membatalkan pengiriman email download
      if (updatedOrder.requires_activation) {
        try {
          // Kroscek apakah email ini sebenarnya sudah terdaftar di auth.users untuk menghindari collision error
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const existingAuthUser = userList?.users.find(
            u => u.email?.toLowerCase() === updatedOrder.customer_email.toLowerCase()
          );

          if (!existingAuthUser) {
            const { data: inviteData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
              type: 'invite',
              email: updatedOrder.customer_email,
              options: {
                data: { 
                  full_name: updatedOrder.customer_name,
                  whatsapp: updatedOrder.whatsapp_number
                },
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')}/dashboard`
              }
            });

            if (!authError && inviteData) {
              if (inviteData.user?.id) {
                await supabaseAdmin
                  .from('orders')
                  .update({ user_id: inviteData.user.id })
                  .eq('id', order_id);
              }
              
              let rawLink = inviteData.properties?.action_link;
              if (rawLink) {
                const productionDomain = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://seq-master.vercel.app';
                activationLink = rawLink.includes('http://localhost:3000')
                  ? rawLink.replace('http://localhost:3000', productionDomain)
                  : rawLink;
              }
            }
          } else {
            console.log("User email node already present inside Auth record matrix, skipping invite generation.");
          }
        } catch (authErr) {
          console.error("Automated isolated auth registration section encountered a failure:", authErr);
        }
      }

      // AKSI BLAST: Email ini sekarang DIJAMIN akan selalu terkirim membawa tautan unduhan Cloudflare R2 apa pun yang terjadi pada status pendaftaran!
      await sendTransactionalReceiptEmail({
        customerName: updatedOrder.customer_name,
        customerEmail: updatedOrder.customer_email,
        orderId: updatedOrder.id,
        productTitle: updatedOrder.products?.title || 'Premium Sequencer Patch',
        totalAmount: updatedOrder.total_amount,
        downloadUrl: secureDownloadUrl,
        activationUrl: activationLink
      });
    }

    return NextResponse.json({ success: true, status: finalDatabaseStatus });

  } catch (error: any) {
    console.error('Critical collision in webhook payment automation engine:', error);
    return NextResponse.json({ error: error.message || 'Internal Hook Core Exception' }, { status: 500 });
  }
}