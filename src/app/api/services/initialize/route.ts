import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendAdminServiceAlertEmail } from '@/lib/email'; // Impor fungsi notifikasi kustom dari email.ts

export async function POST(request: Request) {
  try {
    const { 
      user_id, 
      project_title, 
      category, 
      reference_url, 
      stems_url, 
      notes, 
      customer_name, 
      customer_email, 
      whatsapp_number 
    } = await request.json();

    // Validate required fields
    if (!project_title || !customer_name || !customer_email || !whatsapp_number) {
      return NextResponse.json({
        error: 'Missing required fields: project_title, customer_name, customer_email, whatsapp_number'
      }, { status: 400 });
    }

    // 1. Simpan manifes proyek jasa ke tabel internal database Supabase secara aman
    const { data, error } = await supabase
      .from('jasa_orders')
      .insert([{
        user_id: user_id || null,
        project_title,
        category,
        reference_url,
        stems_url,
        notes,
        customer_name,
        customer_email,
        whatsapp_number,
        price: 0,
        payment_status: 'pending',
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // 2. SINKRONISASI EMAIL: Send email asynchronously (non-blocking)
    // Email failure should not fail the entire request
    if (data) {
      sendAdminServiceAlertEmail({
        orderId: data.id,
        customerName: customer_name,
        customerEmail: customer_email,
        whatsappNumber: whatsapp_number,
        serviceType: category,
        projectTitle: project_title,
        referenceLink: reference_url || '',
        driveLink: stems_url || '',
        projectNotes: notes || ''
      }).catch((emailErr) => {
        console.error('Email notification failed but order was saved:', emailErr);
      });
    }

    return NextResponse.json({ success: true, orderId: data.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Service order pipeline collapsed:', error);
    return NextResponse.json({ error: message || 'Internal Server Error' }, { status: 500 });
  }
}
