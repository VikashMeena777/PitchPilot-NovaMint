import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PitchPilot — Your AI Sales Rep That Works 24/7",
    template: "%s | PitchPilot",
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
  authors: [{ name: "PitchPilot" }],
  openGraph: {
    title: "PitchPilot — Your AI Sales Rep That Works 24/7",
    description:
      "AI-powered sales outreach that researches prospects, writes hyper-personalized cold emails, and sends automated follow-up sequences.",
    type: "website",
    locale: "en_US",
    siteName: "PitchPilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchPilot — Your AI Sales Rep That Works 24/7",
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
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
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
