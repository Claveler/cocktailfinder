import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";
import GlobalBottomNavBar from "@/components/common/GlobalBottomNavBar";
import { primaryFont, monoFont, headingFont } from "@/lib/fonts";
import { Toaster } from "sonner";
import ServerThemeProvider from "@/components/theme/ServerThemeProvider";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Piscola.net | The Piscola Network",
  description: "Find the best venues to enjoy Piscola in your city",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Piscola.net | The Piscola Network",
    description: "Find the best venues to enjoy Piscola in your city",
    images: [
      {
        url: "/assets/opengraph-thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Piscola.net - Find the best venues to enjoy Piscola",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piscola.net | The Piscola Network",
    description: "Find the best venues to enjoy Piscola in your city",
    images: ["/assets/opengraph-thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${primaryFont.variable} ${monoFont.variable} ${headingFont.variable} font-sans antialiased`}
      >
        <ServerThemeProvider>
          <NavBar />
          <main className="min-h-screen pt-16 pb-16 md:pb-0">{children}</main>
          <Footer />
          <GlobalBottomNavBar />
          <Toaster richColors position="top-right" />
          <Analytics />
        </ServerThemeProvider>
      </body>
    </html>
  );
}
