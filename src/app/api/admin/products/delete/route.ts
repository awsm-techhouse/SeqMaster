import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    // 1. Menggunakan properti URL yang valid bagi TypeScript: pathname & searchParams
    const { pathname, searchParams } = new URL(request.url);
    
    // Mengambil ID dari parameter kueri (?id=...) atau dari bagian akhir segmen jalur
    const id = searchParams.get('id') || pathname.split('/').pop();

    if (!id || id === 'delete') {
      return NextResponse.json(
        { success: false, error: 'ID produk tidak valid atau kosong.' }, 
        { status: 400 }
      );
    }

    // 2. Eksekusi penghapusan baris data pada tabel public.products Supabase
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Modul sekuenser berhasil dihapus dari inventaris toko secara permanen.' 
    });

  } catch (error: any) {
    console.error('Failure inside delete product handler:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Exception' }, 
      { status: 500 }
    );
  }
}