import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow access to /add-device route
  if (request.nextUrl.pathname.startsWith('/add-device')) {
    return NextResponse.next();
  }

  // Read ALLOWED_DEVICES from environment variable
  const allowedDevicesString = process.env.ALLOWED_DEVICES || '';
  const allowedDevices = allowedDevicesString
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  // Get device_auth cookie from request
  const deviceAuth = request.cookies.get('device_auth')?.value;

  // Check if device is authorized
  if (deviceAuth && allowedDevices.includes(deviceAuth)) {
    return NextResponse.next();
  }

  // Access denied
  return new NextResponse('Access denied — This device is not authorized.', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Apply middleware to all routes
export const config = {
  matcher: '/(.*)',
};
