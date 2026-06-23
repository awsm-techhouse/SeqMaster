import nodemailer from 'nodemailer';

// ==========================================
// 1. DEFINISI KONTRAK INTERFACE (TYPE-SAFE)
// ==========================================

export interface EmailPayload {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productTitle: string;
  totalAmount: number;
  downloadUrl: string;
  activationUrl?: string;
}

export interface ServiceAlertPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  whatsappNumber: string;
  serviceType: string;
  projectTitle: string;
  referenceLink: string;
  driveLink: string;
  projectNotes: string;
}

export interface UserInvoiceAlertPayload {
  customerName: string;
  customerEmail: string;
  projectTitle: string;
  invoiceId: string;
  termDescription: string;
  amount: number;
  paymentUrl: string;
}

// ==========================================
// 2. PIPELINE EKSEKUSI PENGIRIMAN EMAIL
// ==========================================

// FUNGSI A: Kirim Nota Transaksi + Link Download R2 (.ZIP) ke Pembeli Toko Ritel
export async function sendTransactionalReceiptEmail(payload: EmailPayload): Promise<void> {
  const { customerName, customerEmail, orderId, productTitle, totalAmount, downloadUrl, activationUrl } = payload;
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS },
  });

  const htmlTemplate = `
    <div style="background-color: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #f4f4f5; font-size: 18px;">SEQMASTER</span>
      </div>
      <h2 style="font-weight: 900; text-transform: uppercase; color: #10b981; font-size: 16px; border-bottom: 1px solid #18181b; padding-bottom: 10px;">Transaksi Terverifikasi Sukses</h2>
      <p style="font-size: 13px; color: #a1a1aa;">Halo <strong>${customerName}</strong>,</p>
      <p style="font-size: 13px; color: #a1a1aa;">Akses paket sekuenser premium Anda telah dibuka penuh.</p>
      <div style="background-color: #020617; border: 1px solid #1e293b; padding: 15px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 11px;">
        <p style="margin: 0;">ORDER ID: ${orderId}</p>
        <p style="margin: 0; text-transform: uppercase;">ITEM NODE: ${productTitle}</p>
        <p style="margin: 0; color: #10b981; font-weight: bold;">VALUE: IDR ${totalAmount.toLocaleString('id-ID')}</p>
      </div>
      ${activationUrl ? `
        <div style="background-color: #451a03; border: 1px solid #78350f; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <h4 style="color: #fbbf24; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">⚠️ Amankan Akun Dashboard Anda</h4>
          <p style="color: #d97706; font-size: 11px; margin: 0 0 10px 0;">Silakan klik tombol di bawah untuk mendaftarkan akun Dashboard agar item Anda tersimpan permanen.</p>
          <a href="${activationUrl}" style="display: block; text-align: center; background-color: #fbbf24; color: #09090b; font-weight: bold; text-decoration: none; padding: 12px; border-radius: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Daftar / Aktivasi Akun</a>
        </div>
      ` : ''}
      <div style="margin-top: 30px; text-align: center;">
        <a href="${downloadUrl}" style="display: block; background-color: #10b981; color: #09090b; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Unduh Berkas Master (.ZIP)</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SeqMaster Audio" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `[CONFIRMED] Secure Node Delivery - Order ${orderId}`,
    html: htmlTemplate,
  });
}

// FUNGSI B: Kirim Alarm Notifikasi Projek Jasa Baru ke Email Admin Operational
export async function sendAdminServiceAlertEmail(payload: ServiceAlertPayload): Promise<void> {
  const { orderId, customerName, customerEmail, whatsappNumber, serviceType, projectTitle, referenceLink, driveLink, projectNotes } = payload;
  
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
      console.error('❌ Email config missing: GMAIL_USER or GMAIL_APP_PASS environment variables are not set');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS },
    });

    const htmlTemplate = `
    <div style="background-color: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #fbbf24; font-size: 16px;">🚨 NOTIFIKASI ORDER JASA BARU</span>
        <p style="font-size: 10px; color: #71717a; font-family: monospace; margin-top: 5px;">SeqMaster Operations Hub</p>
      </div>
      <div style="background-color: #020617; border: 1px solid #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 11px; line-height: 1.8;">
        <p style="margin: 0;"><span style="color: #475569;">SERVICE ID  :</span> ${orderId}</p>
        <p style="margin: 0;"><span style="color: #475569;">LAYANAN     :</span> <span style="color: #fbbf24; font-weight: bold; text-transform: uppercase;">${serviceType}</span></p>
        <p style="margin: 0;"><span style="color: #475569;">PROYEK      :</span> <span style="color: #ffffff; font-weight: bold; text-transform: uppercase;">${projectTitle}</span></p>
        <p style="margin: 0;"><span style="color: #475569;">NAMA KLIEN  :</span> ${customerName}</p>
        <p style="margin: 0;"><span style="color: #475569;">EMAIL KLIEN :</span> ${customerEmail}</p>
        <p style="margin: 0;"><span style="color: #475569;">WHATSAPP    :</span> ${whatsappNumber}</p>
        <p style="margin: 0; color: #38bdf8;"><span style="color: #475569;">LINK REF    :</span> ${referenceLink || '-'}</p>
        <p style="margin: 0; color: #38bdf8;"><span style="color: #475569;">LINK DRIVE  :</span> ${driveLink || '-'}</p>
      </div>
      <h4 style="color: #cbd5e1; font-size: 12px; margin-bottom: 5px; text-transform: uppercase;">Catatan Khusus Klien:</h4>
      <div style="background-color: #18181b; border: 1px solid #27272a; padding: 15px; border-radius: 10px; font-size: 12px; color: #d4d4d8; white-space: pre-wrap;">
        ${projectNotes || 'Tidak ada catatan tambahan.'}
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <a href="https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}" style="display: block; background-color: #25d366; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Respon Klien via WhatsApp</a>
      </div>
    </div>
  `;

    const result = await transporter.sendMail({
      from: `"SeqMaster Core System" <${process.env.GMAIL_USER}>`,
      to: "awsm.techhouse@gmail.com",
      subject: `🚨 [NEW SERVICES REQUEST] ${serviceType} - ${customerName}`,
      html: htmlTemplate,
    });

    console.log('✅ Service alert email sent successfully:', { messageId: result.messageId, to: 'awsm.techhouse@gmail.com' });
  } catch (error) {
    console.error('❌ Failed to send service alert email:', error instanceof Error ? error.message : String(error));
  }
}

// FIX UTAMA: Kirim Notifikasi Link Invoice Tagihan Termin (Milestone Billing) ke Email Musisi/Klien
export async function sendUserInvoiceNotificationEmail(payload: UserInvoiceAlertPayload): Promise<void> {
  const { customerName, customerEmail, projectTitle, invoiceId, termDescription, amount, paymentUrl } = payload;
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASS },
  });

  const htmlTemplate = `
    <div style="background-color: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #10b981; font-size: 18px;">SEQMASTER</span>
        <p style="font-size: 10px; color: #71717a; font-family: monospace; text-transform: uppercase; margin-top: 5px;">Acoustic Production Invoice Node</p>
      </div>

      <h2 style="font-weight: 900; text-transform: uppercase; color: #fbbf24; font-size: 15px; border-bottom: 1px solid #18181b; padding-bottom: 10px;">Pemberitahuan Tagihan Baru</h2>
      
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Halo <strong>${customerName}</strong>,</p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Admin kami telah menerbitkan tagihan termin pembayaran baru untuk proyek kustom audio Anda:</p>

      <div style="background-color: #020617; border: 1px solid #1e293b; padding: 15px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 11px; line-height: 1.8;">
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">NAMA PROYEK:</span> ${projectTitle.toUpperCase()}</p>
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">INVOICE ID :</span> ${invoiceId}</p>
        <p style="margin: 0; color: #fbbf24; font-weight: bold;"><span style="color: #475569;">DESKRIPSI  :</span> ${termDescription.toUpperCase()}</p>
        <p style="margin: 0; color: #10b981; font-weight: bold;"><span style="color: #475569;">NOMINAL    :</span> IDR ${amount.toLocaleString('id-ID')}</p>
      </div>

      <p style="font-size: 12px; color: #71717a; line-height: 1.5;">Anda dapat melunasi tagihan ini langsung melalui halaman Dashboard akun Anda atau mengklik tautan gerbang pembayaran Midtrans aman di bawah ini:</p>

      <div style="margin-top: 25px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')}/dashboard" style="display: block; background-color: #fbbf24; color: #09090b; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);">Bayar Tagihan Sekarang</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SeqMaster Billing" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `🚨 [TAGIHAN BARU] Invoice ${termDescription} - Proyek ${projectTitle}`,
    html: htmlTemplate,
  });
}