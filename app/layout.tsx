import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barsiisaa — learn Afaan Oromo",
  description: "Practise Afaan Oromo words with short daily lessons.",
  manifest: "/manifest.webmanifest",
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
            <Link href="/about" className="text-sm text-slate-500 hover:text-slate-800">
              About the words
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
