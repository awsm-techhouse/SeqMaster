import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, project_title, category, reference_url, stems_url, notes, customer_name, customer_email, whatsapp_number } = await request.json();

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

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}