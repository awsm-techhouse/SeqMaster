import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // 1. Ambil teks mentah body untuk mengantisipasi ping handshake kosong dari Midtrans Dashboard
    const rawBodyText = await request.text();
    
    if (!rawBodyText || rawBodyText.trim() === "") {
      console.log("Midtrans Diagnostic URL Verification Handshake Triggered.");
      // Kembalikan status HTTP 200 OK dengan format JSON murni agar dasbor Midtrans mendeteksinya sukses
      return NextResponse.json({ 
        status: "verified", 
        message: "SeqMaster Webhook Endpoint is active and operational." 
      }, { status: 200 });
    }

    // 2. Jika payload terisi data transaksi asli, konversikan ke objek JSON
    const body = JSON.parse(rawBodyText);
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id parameter node' }, { status: 400 });
    }

    // Tentukan status sinkronisasi final sesuai dengan realitas transaksi ledger
    let finalDatabaseStatus = 'pending';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        finalDatabaseStatus = 'settlement'; // Sinkronisasi status resmi Midtrans
      }
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      finalDatabaseStatus = 'failed';
    }

    // 3. Mutasi status baris data pada tabel tunggal 'orders' Supabase
    const { error: dbError } = await supabase
      .from('orders')
      .update({ status: finalDatabaseStatus })
      .eq('id', order_id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, status: finalDatabaseStatus });

  } catch (error: any) {
    console.error('Critical failure inside webhook handler pipeline:', error);
    return NextResponse.json({ error: error.message || 'Internal Hook Exception' }, { status: 500 });
  }
}