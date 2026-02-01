import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MineGNK - GPU for Mining',
  description:
    'Rent enterprise-grade GPUs to mine cryptocurrency on the Gonka network. Pay in fiat currency and earn GNK tokens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to HubSpot for faster form loading */}
        <link rel="preconnect" href="https://js-eu1.hsforms.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js-eu1.hsforms.net" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
