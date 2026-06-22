import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration Error: Kredensial Cloudflare R2 kosong di .env.local' 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Berkas kosong.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split('.').pop();
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const uniqueFileName = `${uploadType}-${uniqueId}.${fileExtension}`;
    
    const targetDirectory = uploadType === 'preview' ? 'public/previews' : 'secure/masters';
    const targetObjectKey = `${targetDirectory}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: targetObjectKey,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // REFACTOR: Keduanya sekarang mengembalikan objectKey murni untuk disimpan di database
    return NextResponse.json({ 
      success: true, 
      location: targetObjectKey, 
      objectKey: targetObjectKey 
    });

  } catch (error: any) {
    console.error('R2 upload handler crash:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}