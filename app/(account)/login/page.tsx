"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Mail, Chrome, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/auth/callback`;

    console.log("🔐 Starting Google OAuth signin:", { redirectUrl });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log("🔄 Google OAuth result:", {
        success: !error,
        error: error?.message,
        data: !!data,
        url: data?.url,
      });

      if (error) {
        console.error("❌ Error signing in with Google:", error);
      } else {
        console.log("✅ Google OAuth initiated successfully");
      }
    } catch (error) {
      console.error("❌ Google OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/auth/callback`;

    console.log("📬 Starting magic link signin:", { email, redirectUrl });

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      console.log("📬 Magic link result:", {
        success: !error,
        error: error?.message,
        data: !!data,
        email,
      });

      if (error) {
        console.error("❌ Error sending magic link:", error);
      } else {
        console.log("✅ Magic link sent successfully to:", email);
        setMagicLinkSent(true);
      }
    } catch (error) {
      console.error("❌ Magic link error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CocktailFinder
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to discover amazing cocktail venues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {magicLinkSent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="text-green-600 dark:text-green-400">
                  <Mail className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Check your email</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    We&apos;ve sent a magic link to <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Try different email
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Google Sign In */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  {loading ? "Connecting..." : "Continue with Google"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Email Magic Link */}
                <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    By signing in, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Authentication powered by{" "}
            <span className="font-semibold text-primary">Supabase</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
