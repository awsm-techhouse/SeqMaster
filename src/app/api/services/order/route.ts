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
      category, 
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
        category: category || body.category || 'Custom Service',
        project_title: project_title || 'Untitled Project',
        reference_url: reference_url || '',
        stems_url: stems_url || '',
        notes: notes || '',
        status: 'pending' // Menunggu negosiasi harga / deal berkas multi-track
      }]);

    if (dbError) throw dbError;

    // 2. SOLUSI NOTIFIKASI TYPE-SAFE: Send email asynchronously (non-blocking)
    // Email failure should not fail the entire request
    sendAdminServiceAlertEmail({
      orderId: uniqueServiceId,
      customerName: customer_name || '',
      customerEmail: customer_email || '',
      whatsappNumber: whatsapp_number || '',
      serviceType: category || body.category || 'Custom Service',
      projectTitle: project_title || 'Untitled Project',
      referenceLink: reference_url || '',
      driveLink: stems_url || '',
      projectNotes: notes || ''
    }).catch((emailErr) => {
      console.error('Email notification failed but order was saved:', emailErr);
    });

    return NextResponse.json({ success: true, orderId: uniqueServiceId });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Service form pipeline crash:', error);
    return NextResponse.json({ error: message || 'Internal Server Error' }, { status: 500 });
  }
}