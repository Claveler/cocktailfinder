import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/common/NavBar";
import { primaryFont, monoFont, headingFont } from "@/lib/fonts";
import { Toaster } from "sonner";
import ClientThemeProvider from "@/components/theme/ClientThemeProvider";

export const metadata: Metadata = {
  title: "Piscola.net",
  description: "Find the best venues to enjoy Piscola in your city",
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
        <ClientThemeProvider>
          <NavBar />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors position="top-right" />
        </ClientThemeProvider>
      </body>
    </html>
  );
}
