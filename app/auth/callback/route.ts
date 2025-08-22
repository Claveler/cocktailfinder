import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  // Auth callback processing
  if (process.env.NODE_ENV === "development") {
    console.log("Auth callback:", { hasCode: !!code, error, origin });
  }

  // If there's an error in the URL (like expired OTP), redirect to error page
  if (error) {
    console.log("Auth error from URL:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // If we have a code, try to exchange it for a session
  if (code) {
    const supabase = createClient();
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      if (process.env.NODE_ENV === "development") {
        console.log("Auth session created for:", data.user?.email);
      }
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Error exchanging auth code:", exchangeError.message);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
