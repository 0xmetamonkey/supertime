import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
import { ThemeProvider } from "./components/ThemeProvider";
import { LanguageProvider } from "./components/LanguageContext";

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
          logoImageUrl: "/logo.png",
          showOptionalSRP: false,
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
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="zoom-domain-verification" content="ZOOM_verify_16ae31b7f3954bf48e30084ba1a6977b" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                } catch (_) {}
              `,
            }}
          />
        </head>
        <body
          className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100 transition-colors duration-200`}
        >
          <ThemeProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
