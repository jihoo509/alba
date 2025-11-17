import { NextResponse } from 'next/server';

export async function GET() {
  // OAuth 로그인 후 들어오는 경로
  return NextResponse.redirect('/dashboard');
}
