import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yumlo - Chytré plánování jídel | AI aplikace pro úsporu potravin",
  description: "Ušetřete až 6000 Kč měsíčně s Yumlo AI plánovačem jídel. Využijte potraviny, které už máte, snižte plýtvání a získejte recepty na míru. 7 dní zdarma.",
  keywords: "plánování jídel, AI recepty, plýtvání potravinami, úspora peněz, nákup potravin, Česká republika, aplikace recepty, úspora v kuchyni, chytré vaření, Praha, Brno, Ostrava",
  authors: [{ name: "Yumlo Tým" }],
  creator: "Yumlo",
  publisher: "Yumlo",
  robots: "index, follow",
  openGraph: {
    title: "Yumlo - Chytré plánování jídel pro české rodiny",
    description: "Přestaňte plýtvat jídlem a penězi. Získejte AI recepty založené na tom, co máte v lednici. Ušetřete až 6000 Kč měsíčně s chytrým plánováním jídel.",
    url: "https://yumlo.cz",
    siteName: "Yumlo",
    images: [
      {
        url: "/og-image-cz.jpg",
        width: 1200,
        height: 630,
        alt: "Yumlo - AI aplikace pro plánování jídel",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yumlo - Proměňte nákupy v úspory",
    description: "AI plánovač jídel, který vám ušetří až 6000 Kč měsíčně využitím surovin, které už máte",
    images: ["/og-image-cz.jpg"],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.jpg',
  },
  manifest: '/manifest.json',
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <head>
        <link rel="alternate" hrefLang="cs" href="https://yumlo.cz" />
        <meta name="geo.region" content="CZ" />
        <meta name="geo.placename" content="Česká republika" />
        <meta name="geo.position" content="49.75;15.5" />
        <meta name="ICBM" content="49.75, 15.5" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
