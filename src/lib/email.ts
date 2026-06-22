import nodemailer from 'nodemailer';

// Manifes tipe data payload korespondensi surat elektronik
export interface EmailPayload {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productTitle: string;
  totalAmount: number;
  downloadUrl: string;
  activationUrl?: string;
}

// PIPELINE ENGINE: Fungsi pengirim email kustom berbasis SMTP Gmail Node
export async function sendTransactionalReceiptEmail(payload: EmailPayload): Promise<void> {
  const {
    customerName,
    customerEmail,
    orderId,
    productTitle,
    totalAmount,
    downloadUrl,
    activationUrl,
  } = payload;

  // Membuka transport channel secure SMTP pooling
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  // Komposisi Desain Surat Premium Dark Luxury Studio Layout
  const htmlTemplate = `
    <div style="background-color: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #f4f4f5; font-size: 18px;">SEQMASTER</span>
        <p style="font-size: 10px; color: #71717a; font-family: monospace; text-transform: uppercase; margin-top: 5px;">Acoustic Engineering Platform Node</p>
      </div>

      <h2 style="font-weight: 900; text-transform: uppercase; color: #10b981; font-size: 16px; border-bottom: 1px solid #18181b; padding-bottom: 10px;">Transaksi Terverifikasi Sukses</h2>
      
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Halo <strong>${customerName}</strong>,</p>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Pembayaran Anda untuk modul sekuenser premium telah berhasil diklarifikasi oleh jaringan pusat keuangan SeqMaster.</p>

      <div style="background-color: #020617; border: 1px solid #1e293b; padding: 15px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 11px; line-height: 1.8;">
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">ORDER ID:</span> ${orderId}</p>
        <p style="margin: 0; color: #cbd5e1; text-transform: uppercase;"><span style="color: #475569;">ITEM NODE:</span> ${productTitle}</p>
        <p style="margin: 0; color: #10b981; font-weight: bold;"><span style="color: #475569;">VALUE:</span> IDR ${totalAmount.toLocaleString('id-ID')}</p>
      </div>

      ${activationUrl ? `
        <div style="background-color: #451a03; border: 1px solid #78350f; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: left;">
          <h4 style="color: #fbbf24; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: bold;">⚠️ Aktivasi Akun Otomatis Anda</h4>
          <p style="color: #fcd34d; font-size: 11px; margin: 0 0 15px 0; line-height: 1.5;">Email Anda belum terdaftar di dalam klaster sistem. Kami telah mengonfigurasi akun penampung agar aset Anda tersimpan aman.</p>
          <a href="${activationUrl}" style="display: block; text-align: center; background-color: #fbbf24; color: #09090b; font-weight: bold; text-decoration: none; padding: 12px; border-radius: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Set Password & Aktivasi Akun</a>
        </div>
      ` : ''}

      <div style="margin-top: 30px; text-align: center;">
        <a href="${downloadUrl}" style="display: block; background-color: #10b981; color: #09090b; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Unduh Berkas Master (.ZIP)</a>
        <span style="display: block; font-size: 9px; color: #52525b; font-family: monospace; margin-top: 8px; text-transform: uppercase;">Tautan Proteksi Cloudflare R2 Kedaluwarsa otomatis Dalam 48 Jam</span>
      </div>

      <div style="border-top: 1px solid #18181b; margin-top: 40px; padding-top: 20px; font-size: 10px; font-family: monospace; color: #52525b; text-align: center;">
        Matrix System Cluster Node v1.6.2 // Operational Hub
      </div>
    </div>
  `;

  // Kirim payload surat secara asinkron menembus filter inbox
  await transporter.sendMail({
    from: `"SeqMaster Operations" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `[CONFIRMED] Secure Node Delivery - Order ${orderId}`,
    html: htmlTemplate,
  });
}