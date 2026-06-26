import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_PUBLIC_URL || '';

  // Telefon/emülatör localhost'u göremez — panelin IP'sinden API adresi üret
  if (!apiBaseUrl || apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
    const host = request.headers.get('host')?.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      apiBaseUrl = `http://${host}:3001`;
    } else {
      apiBaseUrl = apiBaseUrl || 'http://localhost:3001';
    }
  }

  return NextResponse.json({
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
    version: 1,
  });
}
