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
  title: 'Copa Fly - Bolão Progressivo',
  description: 'Faça sua aposta na Copa Fly. Bolão mata-mata de 1 dia.',
};

import Navigation from '@/components/layout/Navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-background`}>
        {/* Overlay for better text readability over background */}
        <div className="min-h-screen bg-black/80 backdrop-blur-[2px]">
          {children}
        </div>
        <Navigation />
      </body>
    </html>
  );
}
