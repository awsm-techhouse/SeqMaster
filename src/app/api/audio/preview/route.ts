import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const objectKey = searchParams.get('key');

    if (!objectKey) {
      return new Response('Bad Request: Missing audio key parameter.', { status: 400 });
    }

    // Membersihkan string jika pembeli tidak sengaja memasukkan domain penuh ke parameter
    const cleanKey = objectKey.includes('public/previews/')
      ? 'public/previews/' + objectKey.split('public/previews/').pop()
      : objectKey;

    // Siapkan perintah pembacaan objek biner dari Cloudflare R2
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: cleanKey,
    });

    // Buat signed URL instan yang kedaluwarsa dalam 15 menit (900 detik) demi menghemat resource
    const temporaryPresignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    // Lakukan redirect HTTP 302 secara instan. Elemen HTML5 <audio> browser mendukung alur ini penuh.
    return NextResponse.redirect(temporaryPresignedUrl);

  } catch (error: any) {
    console.error('Failure inside audio gateway router:', error);
    return new Response(`Audio Stream Core Error: ${error.message}`, { status: 500 });
  }
}