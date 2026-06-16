import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Providers from "@/components/providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Mimotes - AI Chatbot Berbasis Pengetahuan",
  description:
    "Chatbot AI yang dapat dilatih dari dokumen Anda. Upload PDF, DOCX, TXT, CSV, atau URL website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
      suppressHydrationWarning
      style={{
        "--font-geist-sans": "system-ui, -apple-system, sans-serif",
        "--font-geist-mono": "ui-monospace, monospace",
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        {/* BUG-014: Global skip-to-content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Lewati ke konten utama
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
          </Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "bg-background border border-border text-foreground",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
