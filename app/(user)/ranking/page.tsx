'use client';

import { Trophy, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RankingPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.05),transparent_70%)]">
            <div className="absolute top-10 left-10 opacity-10 blur-2xl w-64 h-64 bg-primary rounded-full animate-pulse" />
            <div className="absolute bottom-10 right-10 opacity-5 blur-3xl w-80 h-80 bg-primary rounded-full" />

            <div className="glass-panel p-10 rounded-[3.5rem] w-full max-w-sm border border-white/10 shadow-3xl text-center relative overflow-hidden animate-in zoom-in-95 backdrop-blur-2xl">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 rotate-12 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                    <Trophy className="w-10 h-10 text-primary animate-bounce" />
                </div>

                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">RANKING <br /> <span className="text-primary not-italic font-sans">COPA FLY</span></h2>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mb-8">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Disponível em breve</span>
                </div>

                <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] leading-relaxed mb-10">
                    O ranking oficial será liberado <br /> após o encerramento do campeonato <br /> e processamento de todos os resultados.
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="w-full bg-white text-black font-black uppercase py-5 rounded-3xl shadow-xl flex items-center justify-center gap-2 italic tracking-widest active:scale-95 transition-all"
                >
                    VOLTAR AO INÍCIO
                </button>
            </div>

            <style jsx>{`
                .glass-panel {
                    background: rgba(10, 10, 10, 0.4);
                    backdrop-filter: blur(20px);
                }
             `}</style>
        </main>
    );
}
