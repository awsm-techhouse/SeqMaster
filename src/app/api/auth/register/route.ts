import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email, password, name, whatsapp } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password fields are strictly mandatory.' }, { status: 400 });
    }

    // 1. Daftarkan akun secara administratif (status awal unconfirmed)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, 
      user_metadata: { full_name: name, whatsapp: whatsapp }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 2. Produksi Tautan Token Konfirmasi Registrasi Resmi
    // PASTIKAN PROPERTI 'password' DI BAWAH INI SAKLEK ADA SEPERTI BERIKUT:
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password, // KUNCI UTAMA: Wajib disertakan agar mematuhi spesifikasi GenerateSignupLinkParams Supabase
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')}/dashboard`
      }
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    let activationLink = linkData.properties?.action_link || '';
    const productionDomain = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://seq-master.vercel.app';
    
    // Perbaikan Paksa Localhost Trap
    if (activationLink.includes('http://localhost:3000')) {
      activationLink = activationLink.replace('http://localhost:3000', productionDomain);
    }

    // 3. BLAST EMAIL VIA NODEMAILER (100% Kebal Limitasi Jam Supabase & Masuk Inbox Instan)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    const htmlTemplate = `
      <div style="background-color: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #f4f4f5; font-size: 18px;">SEQMASTER</span>
          <p style="font-size: 10px; color: #71717a; font-family: monospace; text-transform: uppercase; margin-top: 5px;">Account Registration</p>
        </div>
        <h2 style="font-weight: 900; text-transform: uppercase; color: #10b981; font-size: 16px; border-bottom: 1px solid #18181b; padding-bottom: 10px;">Konfirmasi Aktivasi Akun</h2>
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Halo ${name},</p>
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Terima kasih telah bergabung di ekosistem digital SeqMaster. Selesaikan aktivasi untuk membuka dashboard Anda.</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${activationLink}" style="display: block; background-color: #10b981; color: #09090b; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Aktivasi Akun Sekarang</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"SeqMaster Audio" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `[ACTION REQUIRED] Activate Your SeqMaster Account`,
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true, message: 'Secure registration SMTP link generated and dispatched.' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Auth Pipeline Exception' }, { status: 500 });
  }
}