import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { ServiceWorker } from "./service-worker";

export const metadata: Metadata = {
  title: "Barsiisaa — learn Afaan Oromo",
  description: "Practise Afaan Oromo words with short daily lessons.",
  manifest: "/manifest.webmanifest",
  applicationName: "Barsiisaa",
  appleWebApp: { capable: true, title: "Barsiisaa", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-teal-700">
              Barsiisaa
            </Link>
            <nav className="flex gap-4 text-sm text-slate-500">
              {process.env.NODE_ENV === "production" ? null : (
                <Link href="/record" className="hover:text-slate-800">
                  Record
                </Link>
              )}
              <Link href="/about" className="hover:text-slate-800">
                About the words
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
        <ServiceWorker />
      </body>
    </html>
  );
}
