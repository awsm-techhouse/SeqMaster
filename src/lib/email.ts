import nodemailer from 'nodemailer';

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

// PIPELINE 1: Email Receipt Transaksi Pembelian Produk Toko
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
          <a href="${activationUrl}" style="display: block; text-align: center; background-color: #fbbf24; color: #09090b; font-weight: bold; text-decoration: none; padding: 12px; border-radius: 8px; font-size: 11px; text-transform: uppercase;">Daftar / Aktivasi Akun</a>
        </div>
      ` : ''}
      <div style="margin-top: 30px; text-align: center;">
        <a href="${downloadUrl}" style="display: block; background-color: #10b981; color: #09090b; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase;">Unduh Berkas Master (.ZIP)</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SeqMaster Operations" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `[CONFIRMED] Secure Node Delivery - Order ${orderId}`,
    html: htmlTemplate,
  });
}

// PIPELINE 2: Email Notifikasi Inbound Pesanan Jasa Baru Menuju Admin
export async function sendAdminServiceAlertEmail(payload: ServiceAlertPayload): Promise<void> {
  const { orderId, customerName, customerEmail, whatsappNumber, serviceType, projectTitle, referenceLink, driveLink, projectNotes } = payload;
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
        <a href="https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}" style="display: block; background-color: #25d366; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase;">Respon Klien via WhatsApp</a>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"SeqMaster Core System" <${process.env.GMAIL_USER}>`,
    to: "awsm.techhouse@gmail.com", // Target Penerimaan Notifikasi Admin
    subject: `🚨 [NEW SERVICES REQUEST] ${serviceType} - ${customerName}`,
    html: htmlTemplate,
  });
}