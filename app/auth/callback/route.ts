import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  console.log("🔐 Auth callback called with:", {
    code: !!code,
    codePreview: code?.slice(0, 20) + "...",
    error,
    origin,
    next,
    fullUrl: request.url,
  });

  // If there's an error in the URL (like expired OTP), redirect to error page
  if (error) {
    console.log("Auth error from URL:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  // If we have a code, try to exchange it for a session
  if (code) {
    const supabase = createClient();
    console.log("🔄 Attempting to exchange code for session...");

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      console.log("✅ Successfully exchanged code for session:", {
        user: !!data.user,
        session: !!data.session,
        userEmail: data.user?.email,
        userMetadata: data.user?.user_metadata,
      });

      // Verify the session was created
      const { data: verifyData, error: verifyError } =
        await supabase.auth.getSession();
      console.log("🔍 Session verification:", {
        hasSession: !!verifyData.session,
        sessionUser: verifyData.session?.user?.email,
        verifyError: verifyError?.message,
      });

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.log("❌ Error exchanging code:", exchangeError);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
