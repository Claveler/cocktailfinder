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
  keywords:
    "pisco, piscola, cocktail, Chilean drink, venues, bars, restaurants, find pisco",
  authors: [{ name: "Piscola.net" }],
  creator: "Piscola.net",
  publisher: "Piscola.net",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Piscola.net | The Piscola Network",
    description: "Find the best venues to enjoy Piscola in your city",
    url: "https://piscola.net",
    siteName: "Piscola.net",
    images: [
      {
        url: "/assets/piscola-logo.svg",
        width: 1200,
        height: 630,
        alt: "Piscola.net",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piscola.net | The Piscola Network",
    description: "Find the best venues to enjoy Piscola in your city",
    images: ["/assets/piscola-logo.svg"],
    creator: "@piscolanet",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Piscola.net" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="referrer" content="origin-when-cross-origin" />

        {/* Instagram in-app browser compatibility */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="application-name" content="Piscola.net" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="msapplication-config" content="none" />

        {/* Prevent Instagram from adding tracking parameters */}
        <meta property="fb:app_id" content="" />
        <meta property="ia:markup_url" content="https://piscola.net" />

        {/* Force UTF-8 encoding for compatibility */}
        <meta charSet="utf-8" />

        <link rel="canonical" href="https://piscola.net" />
      </head>
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
