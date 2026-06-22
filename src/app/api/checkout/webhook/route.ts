import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { sendTransactionalReceiptEmail } from '@/lib/email';

// INITIALIZE ADMINISTRATIVE CLIENT BYPASSING RLS RESTRICTIONS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const rawBodyText = await request.text();
    
    // Handshake validation untuk dasbor verifikasi Midtrans URL
    if (!rawBodyText || rawBodyText.trim() === "") {
      return NextResponse.json({ status: "verified" }, { status: 200 });
    }

    const body = JSON.parse(rawBodyText);
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing identifier order_id' }, { status: 400 });
    }

    // Tentukan status klaring berdasarkan kiriman Midtrans ledger
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

    // 1. Jalankan mutasi pembaharuan status baris transaksi di tabel orders Supabase
    const { data: updatedOrder, error: dbError } = await supabaseAdmin
      .from('orders')
      .update({ status: finalDatabaseStatus })
      .eq('id', order_id)
      .select('*, products(*)')
      .single();

    if (dbError) throw dbError;

    // 2. ORKESTRASI PIPELINE ASINKRON EMAIL & REGISTRASI JIKA STATUS ADALAH SETTLEMENT (LUNAS)
    if (isSettled && updatedOrder) {
      let secureDownloadUrl = '#';
      let activationLink: string | undefined = undefined;

      // A. Amankan pembuatan tautan unduh biner ZIP R2 hangus 48 jam untuk dimasukkan ke email
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

      // B. REGISTER ENGINE: Jalankan pembuatan akun otomatis via Supabase Auth Admin API jika user baru
      if (updatedOrder.requires_activation) {
        try {
          // Buat undangan / invite pengguna asinkron memanfaatkan Auth Service Role
          const { data: inviteData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            updatedOrder.customer_email,
            {
              data: { 
                full_name: updatedOrder.customer_name,
                whatsapp: updatedOrder.whatsapp_number
              },
              // Arahkan tujuan pengalihan ke dashboard website Anda setelah aktivasi diklik
              redirectTo: `${request.headers.get('origin') || 'https://seq-master.vercel.app'}/dashboard`
            }
          );

          if (authError) throw authError;

          if (inviteData?.user?.id) {
            // Relasikan baris order dengan user_id yang baru saja terbentuk demi keutuhan data
            await supabaseAdmin
              .from('orders')
              .update({ user_id: inviteData.user.id })
              .eq('id', order_id);
              
            // Tangkap tautan undangan resmi Supabase kustom untuk disatukan ke email Nodemailer
            activationLink = inviteData.properties?.action_link || undefined;
          }
        } catch (authErr) {
          console.error("Automated auth user creation sequence failed:", authErr);
        }
      }

      // C. BLAST ENGINE: Kirim berkas gabungan nota + download link R2 + link aktivasi ke email konsumen
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