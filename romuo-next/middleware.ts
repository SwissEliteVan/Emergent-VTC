import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = request.nextUrl;

  if (!url.searchParams.get('utm_campaign')) {
    url.searchParams.set('utm_campaign', 'optimised_funnel_v2');
    url.searchParams.set('source', url.searchParams.get('source') || 'homepage');
    return NextResponse.redirect(url);
  }

  response.headers.set('x-romuo-funnel', 'v2');
  return response;
}

export const config = {
  matcher: '/',
};
