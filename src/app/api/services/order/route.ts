import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendAdminServiceAlertEmail } from '@/lib/email'; // Impor fungsi notifikasi kustom baru kita

export async function POST(request: Request) {
  try {
    const { customer_name, customer_email, whatsapp_number, service_type, notes } = await request.json();
    const uniqueServiceId = `SRV-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    // 1. Simpan manifes proyek jasa ke tabel internal database Supabase
    const { error: dbError } = await supabase
      .from('jasa_orders')
      .insert([{
        id: uniqueServiceId,
        customer_name,
        customer_email,
        whatsapp_number,
        service_type,
        notes,
        status: 'pending' // Menunggu negosiasi harga / deal berkas multi-track
      }]);

    if (dbError) throw dbError;

    // 2. SOLUSI NOTIFIKASI: Picu pengiriman email otomatis ke awsm.techhouse@gmail.com
    await sendAdminServiceAlertEmail({
      orderId: uniqueServiceId,
      customerName: customer_name,
      customerEmail: customer_email,
      whatsappNumber: whatsapp_number,
      serviceType: service_type,
      projectNotes: notes
    });

    return NextResponse.json({ success: true, orderId: uniqueServiceId });

  } catch (error: any) {
    console.error('Service form pipeline crash:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}