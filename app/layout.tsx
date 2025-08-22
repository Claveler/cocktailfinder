import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/common/NavBar";
import { primaryFont, monoFont } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "CocktailFinder",
  description: "Find the best cocktail venues in your city",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${primaryFont.variable} ${monoFont.variable} font-sans antialiased`}
      >
        <NavBar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
