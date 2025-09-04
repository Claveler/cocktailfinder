import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Detect Instagram in-app browser
  const userAgent = request.headers.get("user-agent") || "";
  const isInstagramBrowser =
    userAgent.includes("Instagram") ||
    userAgent.includes("FBAN") ||
    userAgent.includes("FBAV");

  // Handle Instagram/Facebook redirect issues by cleaning tracking parameters
  // and ensuring proper headers for social media in-app browsers
  const url = request.nextUrl.clone();

  // Clean Facebook/Instagram tracking parameters that can cause issues
  const trackingParams = [
    "fbclid",
    "gclid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ];
  let hasTrackingParams = false;

  trackingParams.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasTrackingParams = true;
    }
  });

  // If we cleaned tracking params, redirect to clean URL
  if (hasTrackingParams) {
    return NextResponse.redirect(url);
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optional: Add any route protection logic here
  // For now, we'll just refresh the session

  // Add headers to improve Instagram/Facebook in-app browser compatibility
  supabaseResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Specific headers for Instagram in-app browser (known React.js compatibility issues)
  if (isInstagramBrowser) {
    // Force no caching to prevent stale content issues
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0"
    );
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");

    // Add Content Security Policy for Instagram compatibility
    supabaseResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: https:; connect-src 'self' https:;"
    );

    // Force specific content type
    supabaseResponse.headers.set("Content-Type", "text/html; charset=utf-8");

    // Add specific headers for iOS Instagram compatibility
    supabaseResponse.headers.set("X-UA-Compatible", "IE=edge");
    supabaseResponse.headers.set("format-detection", "telephone=no");
  } else {
    // Standard headers for other browsers
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
