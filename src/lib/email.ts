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

// Tambahkan fungsi ekspor baru ini di bagian paling bawah berkas src/lib/email.ts Anda

export interface ServiceAlertPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  whatsappNumber: string;
  serviceType: string; // contoh: 'Mixing & Mastering', 'Aransemen'
  projectNotes: string;
}

export async function sendAdminServiceAlertEmail(payload: ServiceAlertPayload): Promise<void> {
  const { orderId, customerName, customerEmail, whatsappNumber, serviceType, projectNotes } = payload;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  // Desain email laporan khusus untuk konsumsi internal admin Techhouse
  const htmlTemplate = `
    <div style="background-color: #09090b; color: #f4f4f5; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #fbbf24; font-size: 16px;">⚠️ NOTIFIKASI JASA BARU</span>
        <p style="font-size: 10px; color: #71717a; font-family: monospace; text-transform: uppercase; margin-top: 5px;">SeqMaster Project Inbound Pipeline</p>
      </div>

      <h3 style="font-weight: 900; text-transform: uppercase; color: #cbd5e1; font-size: 14px; border-bottom: 1px solid #18181b; padding-bottom: 10px;">Manifes Pesanan Proyek Klien</h3>
      
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6;">Ada pesanan jasa baru yang masuk ke dalam antrean produksi platform SeqMaster.</p>

      <div style="background-color: #020617; border: 1px solid #1e293b; padding: 18px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 11px; line-height: 1.8;">
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">SERVICE ID :</span> ${orderId}</p>
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">KATEGORI   :</span> <span style="color: #fbbf24; font-weight: bold; text-transform: uppercase;">${serviceType}</span></p>
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">NAMA KLIEN :</span> ${customerName}</p>
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">EMAIL      :</span> ${customerEmail}</p>
        <p style="margin: 0; color: #cbd5e1;"><span style="color: #475569;">WHATSAPP   :</span> ${whatsappNumber}</p>
      </div>

      <h4 style="color: #cbd5e1; font-size: 12px; margin: 20px 0 5px 0; text-transform: uppercase; font-weight: bold;">Catatan / Deskripsi Proyek:</h4>
      <div style="background-color: #18181b; border: 1px solid #27272a; padding: 15px; border-radius: 10px; font-size: 12px; color: #d4d4d8; line-height: 1.6; white-space: pre-wrap;">
        ${projectNotes || 'Tidak ada catatan tambahan dari klien.'}
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}" style="display: block; background-color: #25d366; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Hubungi Klien via WhatsApp</a>
      </div>

      <div style="border-top: 1px solid #18181b; margin-top: 40px; padding-top: 20px; font-size: 10px; font-family: monospace; color: #52525b; text-align: center;">
        SeqMaster Automated Internal Logger // 2026
      </div>
    </div>
  `;

  // Kirim email langsung menuju ke inbox operasional awsm.techhouse@gmail.com
  await transporter.sendMail({
    from: `"SeqMaster System" <${process.env.GMAIL_USER}>`,
    to: "awsm.techhouse@gmail.com", // TARGET INBOX ANDA
    subject: `🚨 [NEW SERVICE] ${serviceType} - Dari ${customerName}`,
    html: htmlTemplate,
  });
}