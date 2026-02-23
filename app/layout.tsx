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
          shimmer: true,
        },
        variables: {
          colorPrimary: "#4461FF",
          colorTextOnPrimaryBackground: "white",
          colorBackground: "white",
          colorText: "black",
          colorInputBackground: "white",
          colorInputText: "black",
          borderRadius: "0px",
          fontFamily: "'Outfit', sans-serif",
        },
        elements: {
          formButtonPrimary:
            "bg-black hover:bg-zinc-800 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white font-black uppercase tracking-widest transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          card: "border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none",
          headerTitle: "font-black uppercase tracking-tighter text-3xl",
          headerSubtitle: "font-bold text-zinc-500 uppercase tracking-widest text-[10px]",
          socialButtonsBlockButton:
            "border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none",
          socialButtonsBlockButtonText: "font-black",
          formFieldLabel: "font-black uppercase tracking-widest text-[10px]",
          formFieldInput: "border-4 border-black p-4 font-bold focus:ring-0 rounded-none",
          footerActionText: "font-bold text-zinc-500",
          footerActionLink: "font-black text-neo-pink hover:text-neo-pink/80 uppercase tracking-widest text-[10px]",
          identityPreviewText: "font-bold",
          identityPreviewEditButtonIcon: "text-black",
          userButtonAvatarBox: "border-2 border-black",
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
