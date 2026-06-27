import { NextResponse } from 'next/server';

export async function GET() {
  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    ''
  ).replace(/\/$/, '');

  if (!apiBaseUrl || apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
    return NextResponse.json(
      {
        error: 'API adresi yapılandırılmamış. Railway web servisinde NEXT_PUBLIC_API_URL ayarlayın.',
        apiBaseUrl: '',
        version: 1,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    apiBaseUrl,
    version: 1,
  });
}
