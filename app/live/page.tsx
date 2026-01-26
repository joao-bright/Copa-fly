'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Play, ChevronRight, Trophy, Clock, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMatches } from '@/lib/data';
import { Match } from '@/lib/types';

export default function LivePage() {
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getMatches();
            setMatches(data);
            setIsLoggedIn(!!localStorage.getItem('copa_user_cpf'));
            setIsLoaded(true);
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        router.push('/');
    };

    const renderHeader = () => (
        <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-4 py-3 flex justify-between items-center bg-black/95 h-16">
            <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
                <img src="/logo.jpg" alt="Fly Cup" className="w-10 h-10 object-contain rounded-full border border-primary/20" />
                <div className="flex flex-col">
                    <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em] leading-none mb-0.5 italic">Ao Vivo</span>
                    <h1 className="text-lg font-black text-white italic tracking-tighter leading-none">COPA FLY</h1>
                </div>
            </div>

            {isLoggedIn ? (
                <button onClick={handleLogout} className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-full text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-all active:scale-95">
                    <LogOut className="w-3 h-3" /> Sair
                </button>
            ) : (
                <button onClick={() => router.push('/login')} className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-full text-[9px] font-black uppercase text-white/40 hover:text-white transition-all active:scale-95 shadow-lg">
                    <LogIn className="w-3 h-3 text-primary" /> Entrar
                </button>
            )}
        </header>
    );

    const liveMatches = matches.filter(m => m.status === 'LIVE');

    // Grouping logic for scheduled matches
    const groupedScheduled = {
        'RODADA 1': matches.filter(m => m.status === 'SCHEDULED' && m.phase === 'GROUP' && m.round === 1),
        'RODADA 2': matches.filter(m => m.status === 'SCHEDULED' && m.phase === 'GROUP' && m.round === 2),
        'RODADA 3': matches.filter(m => m.status === 'SCHEDULED' && m.phase === 'GROUP' && m.round === 3),
        'SEMI-FINAIS': matches.filter(m => m.status === 'SCHEDULED' && m.phase === 'SEMI'),
        'GRANDE FINAL': matches.filter(m => m.status === 'SCHEDULED' && m.phase === 'FINAL'),
    };

    const renderMatchCard = (m: Match, isLive: boolean = false) => (
        <div key={m.id} className={cn(
            "glass-panel p-6 rounded-[2.5rem] border relative overflow-hidden group shadow-2xl transition-all",
            isLive ? "border-red-500/20 shadow-red-500/5 bg-red-500/[0.02]" : "border-white/10 hover:border-primary/30"
        )}>
            {isLive && (
                <div className="absolute top-0 right-0 py-2 px-4 bg-red-500/10 border-l border-b border-red-500/20 rounded-bl-2xl flex items-center gap-1.5 z-20">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] italic">LIVE</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-white/20 text-[7px] font-black uppercase tracking-[0.3em] italic">
                    {m.phase === 'FINAL' ? 'Grande Final' : m.phase === 'SEMI' ? 'Semi-final' : `Grupo ${m.group} - Rodada ${m.round}`}
                </span>
                <span className="text-white/20 text-[7px] font-black uppercase tracking-widest">{m.startTime}</span>
            </div>

            <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full aspect-[1792/768] rounded-2xl bg-black border border-white/5 overflow-hidden shadow-2xl group-hover:border-white/10 transition-all">
                        {m.teamA?.logoUrl ? (
                            <img src={m.teamA.logoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10 font-black text-[10px] uppercase">{m.teamA?.name.substring(0, 3)}</div>
                        )}
                    </div>
                    <span className="text-[10px] font-black text-white/60 uppercase italic tracking-widest">{m.teamA?.name}</span>
                </div>

                {/* Score or VS */}
                <div className="flex flex-col items-center justify-center min-w-[60px]">
                    {isLive ? (
                        <div className="flex flex-col items-center">
                            <div className="text-3xl font-black text-primary italic leading-none mb-1">
                                {m.scoreA ?? 0} <span className="text-white/10 font-normal px-1">-</span> {m.scoreB ?? 0}
                            </div>
                            <span className="text-[6px] text-white/20 font-black uppercase tracking-[0.4em] italic">PLACAR</span>
                        </div>
                    ) : (
                        <span className="text-lg font-black text-primary italic opacity-20 group-hover:opacity-100 transition-opacity">VS</span>
                    )}
                </div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full aspect-[1792/768] rounded-2xl bg-black border border-white/5 overflow-hidden shadow-2xl group-hover:border-white/10 transition-all">
                        {m.teamB?.logoUrl ? (
                            <img src={m.teamB.logoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10 font-black text-[10px] uppercase">{m.teamB?.name.substring(0, 3)}</div>
                        )}
                    </div>
                    <span className="text-[10px] font-black text-white/60 uppercase italic tracking-widest">{m.teamB?.name}</span>
                </div>
            </div>

            {m.streamUrl && (
                <button
                    onClick={() => window.open(m.streamUrl, '_blank')}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl",
                        isLive ? "bg-primary text-black shadow-primary/20" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
                    )}
                >
                    {isLive ? 'ASSISTIR AGORA' : 'TRANSMISSÃO'} <Play className={cn("w-3.5 h-3.5", isLive ? "fill-black" : "fill-current")} />
                </button>
            )}
        </div>
    );

    if (!isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center text-primary font-black animate-pulse uppercase tracking-[0.5em]">SINTONIZANDO...</div>;

    return (
        <main className="min-h-screen bg-black pb-32">
            {renderHeader()}

            <div className="container mx-auto max-w-md pt-24 px-5">
                {/* LIVE NOW SECTION */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20">
                            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Ao Vivo</h2>
                            <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 italic">PARTIDAS EM ANDAMENTO</p>
                        </div>
                    </div>

                    {liveMatches.length === 0 ? (
                        <div className="glass-panel p-10 rounded-[3rem] border border-white/5 text-center bg-white/[0.01]">
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] italic leading-relaxed px-6">
                                Nenhuma partida ao vivo no momento
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {liveMatches.map(m => renderMatchCard(m, true))}
                        </div>
                    )}
                </div>

                {/* UPCOMING SECTION BY ROUNDS */}
                <div className="space-y-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/5 border border-white/10">
                            <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Próximos Jogos</h2>
                            <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 italic">CALENDÁRIO DA COPA</p>
                        </div>
                    </div>

                    {Object.entries(groupedScheduled).map(([title, roundMatches]) => (
                        roundMatches.length > 0 && (
                            <div key={title} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                    <span className="text-[10px] font-black text-primary/60 uppercase italic tracking-[0.4em] font-sans">{title}</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                </div>
                                <div className="space-y-6">
                                    {roundMatches.map(m => renderMatchCard(m, false))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </main>
    );
}
