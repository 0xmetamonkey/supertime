import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const chillax = localFont({
  src: "../public/fonts/chillax/Chillax-Variable.woff2",
  variable: "--font-chillax",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Supertime | supertime.wtf",
  description: "Monetize your time instantly.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Supertime',
  },
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
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
        className={`${chillax.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
