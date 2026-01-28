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
import { Settings, Sparkles } from 'lucide-react';

const IS_MAINTENANCE = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (IS_MAINTENANCE) {
    return (
      <html lang="pt-BR" className="dark">
        <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-black text-white antialiased flex flex-col items-center justify-center p-6 text-center`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(71,241,90,0.05),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img src="/logo.jpg" alt="Fly Cup" className="w-24 h-24 object-contain rounded-full border-2 border-primary/20 shadow-[0_0_30px_rgba(71,241,90,0.2)]" />
                <div className="absolute -top-2 -right-2 bg-primary text-black p-1.5 rounded-lg shadow-xl animate-bounce">
                  <Settings className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.4em] italic mb-1 block">Copa Fly</span>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">MANUTENÇÃO</h1>
              </div>
            </div>

            <div
              className="glass-panel p-8 rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group"
              style={{ background: 'rgba(15, 15, 15, 0.4)', backdropFilter: 'blur(40px)' }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-3">VOLTAREMOS EM BREVE</h2>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed px-4">
                Estamos preparando novidades e realizando ajustes técnicos para garantir a melhor experiência na Copa Fly.
              </p>
            </div>

            <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em] italic">
              Agradecemos a paciência
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-black text-white antialiased`}>
        {children}
        <Navigation />
      </body>
    </html>
  );
}
