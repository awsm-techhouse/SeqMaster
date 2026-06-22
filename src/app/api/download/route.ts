import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, products(master_file_key)')
      .eq('id', orderId)
      .eq('status', 'settlement')
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Akses ditolak. Transaksi belum lunas.' }, { status: 403 });
    }

    // @ts-ignore
    const targetFileKey = orderData.products?.master_file_key;
    if (!targetFileKey) return NextResponse.json({ error: 'Berkas tidak ditemukan.' }, { status: 404 });

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: targetFileKey });
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 172800 }); // Valid 48 Jam

    return NextResponse.json({ downloadUrl: presignedUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}