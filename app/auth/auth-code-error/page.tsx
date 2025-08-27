"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with your authentication link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              The authentication link may have expired or is invalid. This can
              happen if:
            </p>
            <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
              <li>The link is older than 1 hour</li>
              <li>The link has already been used</li>
              <li>There was a network error</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">Try Signing In Again</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Piscola.net
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
