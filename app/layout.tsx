import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";
import GlobalBottomNavBar from "@/components/common/GlobalBottomNavBar";
import { primaryFont, monoFont, headingFont } from "@/lib/fonts";
import { Toaster } from "sonner";
import ServerThemeProvider from "@/components/theme/ServerThemeProvider";

export const metadata: Metadata = {
  title: "Piscola.net",
  description: "Find the best venues to enjoy Piscola in your city",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${primaryFont.variable} ${monoFont.variable} ${headingFont.variable} font-sans antialiased`}
      >
        <ServerThemeProvider>
          <NavBar />
          <main className="min-h-screen pb-16 md:pb-8">{children}</main>
          <Footer />
          <GlobalBottomNavBar />
          <Toaster richColors position="top-right" />
        </ServerThemeProvider>
      </body>
    </html>
  );
}
