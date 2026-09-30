import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionWrapper from "@/components/providers/SessionWrapper";
import { LanguageProvider } from "@/lib/i18n/context";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "ScamCheck — Check before you click, pay or reply",
  description:
    "Evaluate suspicious messages, screenshots, links, phone numbers and QR codes before you click, pay or reply. Consumer digital safety platform.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#142357",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#172033] antialiased selection:bg-trust-subtle selection:text-trust">
        <SessionWrapper>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
              {children}
            </main>
            <Footer />
            <MobileNav />
          </LanguageProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
