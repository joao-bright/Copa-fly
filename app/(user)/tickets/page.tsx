'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket as TicketIcon, ArrowLeft, Trophy, ChevronRight, CheckCircle2, ShieldCheck, Clock, PlusCircle, LogOut, X, Gamepad2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMatches } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { Match, Team, Ticket as SavedTicket } from '@/lib/types';


export default function MyTickets() {
    const router = useRouter();
    const [tickets, setTickets] = useState<SavedTicket[]>([]);
    const [cpf, setCpf] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);

    useEffect(() => {
        const storedCpf = localStorage.getItem('copa_user_cpf');
        const storedName = localStorage.getItem('copa_user_name');
        setCpf(storedCpf);
        setUserName(storedName);

        if (storedCpf) {
            const fetchData = async () => {
                const mData = await getMatches();
                setMatches(mData);

                const { data, error } = await supabase
                    .from('tickets')
                    .select('*, bets(*)')
                    .eq('cpf', storedCpf)
                    .eq('status', 'ACTIVE') // Apenas bilhetes pagos/ativos
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching tickets:', error);
                }
                if (data) {
                    const mapped = (data as any[]).map(t => ({
                        ...t,
                        createdAt: t.created_at,
                        bets: (t.bets || []).map((b: any) => ({
                            matchId: b.match_id,
                            selectedTeamId: b.selected_team_id
                        }))
                    }));
                    setTickets(mapped);
                }
                setIsLoaded(true);
            };
            fetchData();
        } else {
            // Em vez de crashar ou redirecionar, apenas marca como carregado
            // A UI já lida com tickets.length === 0
            setIsLoaded(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };


    const renderHeader = () => (
        <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-4 py-3 flex justify-between items-center bg-black/95 h-16">
            <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
                <img src="/logo.jpg" alt="Fly Cup" className="w-10 h-10 object-contain rounded-full border border-primary/20" />
                <div className="flex flex-col">
                    <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em] leading-none mb-0.5 italic">Palpites</span>
                    <h1 className="text-lg font-black text-white italic tracking-tighter leading-none">COPA FLY</h1>
                </div>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-full text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-all active:scale-95">
                <LogOut className="w-3 h-3" /> Sair
            </button>
        </header>
    );



    if (!isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center text-primary font-black animate-pulse uppercase tracking-[0.5em]">CARREGANDO...</div>;

    return (
        <main className="min-h-screen bg-black pb-28">
            {renderHeader()}

            <div className="container mx-auto max-w-md pt-24 px-5">
                <div className="mb-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em] scale-x-110">{userName || 'APOSTADOR FLY'}</span>
                    </div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        Seus <br /> <span className="text-primary not-italic font-sans">Bilhetes</span>
                    </h2>
                    <div className="h-1 w-12 bg-primary mx-auto mt-6 rounded-full opacity-30 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </div>

                {tickets.length === 0 ? (
                    <div className="glass-panel p-10 rounded-[3rem] text-center border border-white/5 mt-10 animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <TicketIcon className="w-10 h-10 text-white/10" />
                        </div>
                        <h3 className="text-xl font-black text-white/50 uppercase italic tracking-tighter mb-4">Lista Vazia</h3>
                        <p className="text-white/20 text-[10px] uppercase font-black tracking-widest leading-loose mb-10">
                            Você ainda não registrou nenhum palpite nesta copa.
                        </p>
                        <button onClick={() => router.push('/')} className="w-full bg-primary text-black font-black uppercase py-5 rounded-3xl shadow-xl flex items-center justify-center gap-2 italic tracking-widest active:scale-95 transition-all mb-4">
                            CRIAR BILHETE <PlusCircle className="w-5 h-5" />
                        </button>
                        {!cpf && (
                            <button onClick={() => router.push('/login')} className="w-full bg-white/5 text-white/40 font-black uppercase py-4 rounded-3xl border border-white/10 flex items-center justify-center gap-2 italic tracking-widest active:scale-95 transition-all">
                                FAZER LOGIN
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tickets.map((ticket, idx) => {
                            const currentHits = ticket.bets?.reduce((acc: number, b: any) => {
                                const m = matches.find(match => match.id === b.matchId);
                                if (m && m.winnerId && m.winnerId === b.selectedTeamId) return acc + 1;
                                return acc;
                            }, 0) || 0;

                            return (
                                <Link
                                    href={`/tickets/${ticket.id}`}
                                    key={ticket.id}
                                    className="block glass-panel p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl transition-all hover:border-primary/40 hover:bg-white/[0.02]"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Trophy className="w-24 h-24 text-white" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                                                    <TicketIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white/40 uppercase italic tracking-widest leading-none mb-1">ID: {ticket.id.slice(0, 8)}</span>
                                                    <h4 className="text-white font-black text-xl italic tracking-tighter uppercase">Bilhete 0{idx + 1}</h4>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] leading-none">STATUS</span>
                                                <span className="text-[10px] font-black text-primary italic uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{currentHits}/15 acertos</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-xl border border-white/5">
                                                    <Star className="w-3 h-3 text-primary" />
                                                    <span className="text-[9px] font-black text-white/60 uppercase italic tracking-widest">
                                                        {currentHits > 0 ? 'Palpites Certos' : 'Resultado Aguardando'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                                VER DETALHES <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
