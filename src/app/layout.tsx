import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "PitchMint — Your AI Sales Rep That Works 24/7",
    template: "%s | PitchMint",
  },
  description:
    "AI-powered sales outreach that researches prospects, writes hyper-personalized cold emails, and sends automated follow-up sequences. Book more meetings on autopilot.",
  keywords: [
    "AI sales outreach",
    "cold email automation",
    "sales development",
    "email sequences",
    "prospect research",
    "AI SDR",
  ],
  authors: [{ name: "PitchMint" }],
  openGraph: {
    title: "PitchMint — Your AI Sales Rep That Works 24/7",
    description:
      "AI-powered sales outreach that researches prospects, writes hyper-personalized cold emails, and sends automated follow-up sequences.",
    type: "website",
    locale: "en_US",
    siteName: "PitchMint",
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchMint — Your AI Sales Rep That Works 24/7",
    description:
      "AI-powered sales outreach that researches prospects, writes hyper-personalized cold emails, and sends automated follow-up sequences.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col noise">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--pp-bg-surface)",
                  border: "1px solid var(--pp-border-default)",
                  color: "var(--pp-text-primary)",
                },
              }}
            />
            <CookieConsent />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
