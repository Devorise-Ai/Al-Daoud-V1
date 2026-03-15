import type { Metadata } from "next";
import { Outfit, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Al Daoud Courts — Management Dashboard",
  description:
    "Professional management dashboard for Al Daoud Football Courts. Manage bookings, courts, customers, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${notoArabic.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
