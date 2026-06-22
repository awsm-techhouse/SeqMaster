import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendAdminServiceAlertEmail } from '@/lib/email'; // Impor fungsi notifikasi kustom

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customer_name, 
      customer_email, 
      whatsapp_number, 
      service_type, 
      notes,
      // Antisipasi parameter skema eksplisit baru jika dikirim dari client form
      project_title,
      reference_url,
      stems_url
    } = body;

    const uniqueServiceId = `SRV-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    // 1. Simpan manifes proyek jasa ke tabel internal database Supabase
    const { error: dbError } = await supabase
      .from('jasa_orders')
      .insert([{
        id: uniqueServiceId,
        customer_name,
        customer_email,
        whatsapp_number,
        service_type: service_type || body.category || 'Custom Service',
        project_title: project_title || 'Untitled Project',
        reference_url: reference_url || '',
        stems_url: stems_url || '',
        notes: notes || '',
        status: 'pending' // Menunggu negosiasi harga / deal berkas multi-track
      }]);

    if (dbError) throw dbError;

    // 2. SOLUSI NOTIFIKASI TYPE-SAFE: Sediakan parameter lengkap sesuai ServiceAlertPayload di email.ts
    await sendAdminServiceAlertEmail({
      orderId: uniqueServiceId,
      customerName: customer_name || '',
      customerEmail: customer_email || '',
      whatsappNumber: whatsapp_number || '',
      serviceType: service_type || body.category || 'Custom Service',
      projectTitle: project_title || 'Untitled Project', // Diperbaiki: Memenuhi Type Check
      referenceLink: reference_url || '',               // Diperbaiki: Memenuhi Type Check
      driveLink: stems_url || '',                       // Diperbaiki: Memenuhi Type Check
      projectNotes: notes || ''
    });

    return NextResponse.json({ success: true, orderId: uniqueServiceId });

  } catch (error: any) {
    console.error('Service form pipeline crash:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}