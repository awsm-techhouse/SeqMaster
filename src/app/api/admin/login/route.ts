import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const secureAdminPassword = process.env.ADMIN_PASSWORD;

    // Validasi konfigurasi environment variable peladen
    if (!secureAdminPassword) {
      return NextResponse.json(
        { error: 'Server configuration error: ADMIN_PASSWORD node is missing.' },
        { status: 500 }
      );
    }

    // Komparasi kata sandi terisolasi di sisi server
    if (password === secureAdminPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Kunci Sandi Admin Salah. Sesi Akses Ditolak.' },
      { status: 401 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Authentication Error' },
      { status: 500 }
    );
  }
}