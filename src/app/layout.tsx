import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "HamroHisab — Business Operations Simplified",
  description:
    "Modern inventory & business management platform by Leafclutch Technologies",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HamroHisab",
  },
  icons: {
    icon: "/icons/192",
    apple: "/icons/192",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-50 antialiased">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <PWARegister />
      </body>
    </html>
  );
}
