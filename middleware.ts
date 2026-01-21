import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create Supabase client and refresh session
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser();

  // Helper to create redirect with preserved cookies
  const createRedirect = (url: string) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url));
    // Copy all cookies from supabaseResponse to preserve session
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // Redirect authenticated users from landing page to dashboard
  if (user && request.nextUrl.pathname === '/') {
    return createRedirect('/dashboard');
  }

  // Redirect authenticated users away from login/register pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return createRedirect('/dashboard');
  }

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/dashboard', '/meal-planner', '/ai-scanner', '/settings', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    return createRedirect('/login');
  }

  // Authenticated users bypass device authorization for protected routes
  if (user && isProtectedRoute) {
    return supabaseResponse;
  }

  // Allow access to /add-device, webhook routes, waitlist, and auth callback
  if (
    request.nextUrl.pathname.startsWith("/add-device") ||
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/api/stripe/webhook") ||
    request.nextUrl.pathname.startsWith("/waitlist") ||
    request.nextUrl.pathname.startsWith("/api/waitlist")
  ) {
    return supabaseResponse;
  }

  // Debug routes only accessible in development
  if (
    process.env.NODE_ENV === 'development' &&
    (request.nextUrl.pathname.startsWith("/debug") ||
     request.nextUrl.pathname.startsWith("/api/debug"))
  ) {
    return supabaseResponse;
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
    return supabaseResponse;
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
          <h1>Yumlo is currently in development</h1>
          <p>
            This version of the site is private and limited to authorized devices only.<br><br>
            Once we launch the public release, this page will be available for everyone.<br><br>
            Thanks for your patience!
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

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};
