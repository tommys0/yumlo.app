import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow access to /add-device route
  if (request.nextUrl.pathname.startsWith("/add-device")) {
    return NextResponse.next();
  }

  // Read ALLOWED_DEVICES from environment variable
  const allowedDevicesString = process.env.ALLOWED_DEVICES || "";
  const allowedDevices = allowedDevicesString
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  // Get device_auth cookie from request
  const deviceAuth = request.cookies.get("device_auth")?.value;

  // Check if device is authorized
  if (deviceAuth && allowedDevices.includes(deviceAuth)) {
    return NextResponse.next();
  }

  // ✨ Custom unauthorized page
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Yumlo — In Development</title>
        <style>
          body {
            background: #0d0d0d;
            color: #ffffff;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
            margin: 0;
            padding: 0 20px;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 12px;
          }
          p {
            opacity: 0.75;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>🚧 Yumlo is currently in development</h1>
          <p>
            This version of the site is private and limited to authorized devices only.<br><br>
            Once we launch the public release, this page will be available for everyone.<br><br>
            Thanks for your patience ❤️
          </p>
        </div>
      </body>
    </html>
    `,
    {
      status: 403,
      headers: { "Content-Type": "text/html" },
    },
  );
}

// Apply middleware to all routes
export const config = {
  matcher: "/(.*)",
};
