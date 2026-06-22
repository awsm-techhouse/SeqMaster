import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctAdminPassword = process.env.ADMIN_PASSWORD;

    if (!correctAdminPassword) {
      return NextResponse.json(
        { error: 'Konfigurasi Server Error: Password kunci admin belum diatur di env lokal.' },
        { status: 500 }
      );
    }

    if (password === correctAdminPassword) {
      // Mengirim sinyal otorisasi sukses ke sisi klien
      return NextResponse.json({ authenticated: true, message: 'Clearance Access Granted.' });
    }

    return NextResponse.json(
      { authenticated: false, error: 'Kode klaster enkripsi admin tidak valid.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}