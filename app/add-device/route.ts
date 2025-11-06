import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (token) {
    // Create response with redirect
    const response = NextResponse.redirect(new URL('/', request.url));

    // Set the device_auth cookie
    response.cookies.set('device_auth', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  }

  // No token provided - show error message
  return new NextResponse(
    `<html>
      <head><title>Add Device</title></head>
      <body style="padding: 20px; font-family: system-ui;">
        <h1>Add Device</h1>
        <p>No token provided. Please use the URL format:</p>
        <code>/add-device?token=YOUR_DEVICE_TOKEN</code>
      </body>
    </html>`,
    {
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}
