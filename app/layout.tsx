import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google'; // Import Outfit for headings for that modern look
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://copafly.com.br'),
  title: 'Copa Fly',
  description: 'Faça seus palpites, acompanhe a copa em tempo real e concorra ao acumulado!',
  openGraph: {
    title: 'Copa Fly',
    description: 'Faça seus palpites, acompanhe a copa em tempo real e concorra ao acumulado!',
    url: 'https://copafly.com.br',
    siteName: 'Copa Fly',
    locale: 'pt-BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Copa Fly',
    description: 'Faça seus palpites, acompanhe a copa em tempo real e concorra ao acumulado!',
  },
};

import Navigation from '@/components/layout/Navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-black text-white antialiased`}>
        {children}
        <Navigation />
      </body>
    </html>
  );
}
