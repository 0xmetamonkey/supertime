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
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Supertime — Sell your time",
  description: "A marketplace where anyone can sell their time for money.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Supertime',
  },
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsVariant: "blockButton",
          logoPlacement: "inside",
          shimmer: false,
        },
        variables: {
          colorPrimary: "#111111",
          colorTextOnPrimaryBackground: "white",
          colorBackground: "white",
          colorText: "#111111",
          colorInputBackground: "white",
          colorInputText: "#111111",
          borderRadius: "8px",
        },
        elements: {
          formButtonPrimary: "bg-black hover:bg-zinc-800 text-white font-semibold transition-opacity",
          card: "border border-gray-200 rounded-xl shadow-sm",
          headerTitle: "font-semibold text-xl",
          headerSubtitle: "text-gray-500 text-sm",
          socialButtonsBlockButton: "border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors",
          socialButtonsBlockButtonText: "font-medium",
          formFieldLabel: "font-medium text-sm text-gray-700",
          formFieldInput: "border border-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-black",
          footerActionText: "text-gray-500",
          footerActionLink: "font-medium text-black hover:text-gray-700",
          identityPreviewText: "font-medium",
          identityPreviewEditButtonIcon: "text-black",
          userButtonAvatarBox: "border border-gray-200",
          userButtonTrigger: "focus:shadow-none",
          footer: "hidden",
          internal_footer: "hidden",
        }
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
