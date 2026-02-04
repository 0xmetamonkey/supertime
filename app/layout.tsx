import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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

import InAppBrowserPrompt from "./components/InAppBrowserPrompt";
import InstallPrompt from "./components/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <InAppBrowserPrompt />
        <InstallPrompt />
      </body>
    </html>
  );
}
