import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { id, price, payment_notes } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing service identifier key (id)' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('jasa_orders')
      .update({ 
        price: Number(price), 
        payment_notes: payment_notes 
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Service billing configuration updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}