import type { Metadata } from 'next';
import { Cinzel, Crimson_Text } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-crimson',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mutt — Hatch. Breed. Chaos.',
  description: 'AI companion breeding platform on Monad. Purebloods are earned, not born.',
  icons: {
    icon: '/images/logo-64.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${crimsonText.variable}`}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
