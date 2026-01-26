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
    const [filter, setFilter] = useState<'LIVE' | 'FINISHED' | 'SCHEDULED'>('LIVE');
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
                <div className="absolute top-2 left-1/2 -translate-x-1/2 py-1.5 px-3 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2 z-20">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[7px] font-black text-red-500 uppercase tracking-[0.2em] italic">AO VIVO</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 relative z-10 mt-2">
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
                    {isLive || m.status === 'FINISHED' ? (
                        <div className="flex flex-col items-center">
                            <div className="text-3xl font-black text-primary italic leading-none mb-1">
                                {m.scoreA ?? 0} <span className="text-white/10 font-normal px-1">-</span> {m.scoreB ?? 0}
                            </div>
                            <span className="text-[6px] text-white/20 font-black uppercase tracking-[0.4em] italic uppercase">
                                {m.status === 'FINISHED' ? 'CONCLUÍDO' : 'PLACAR'}
                            </span>
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
        <main className="min-h-screen bg-black pb-48">
            {renderHeader()}

            <div className="container mx-auto max-w-md pt-24 px-5">
                {/* FILTERS */}
                <div className="flex bg-zinc-950/50 p-1 rounded-2xl border border-white/5 mb-8">
                    {[
                        { id: 'LIVE', label: 'AO VIVO', icon: Radio },
                        { id: 'FINISHED', label: 'ENCERRADOS', icon: Trophy },
                        { id: 'SCHEDULED', label: 'PRÓXIMOS', icon: Clock },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                filter === t.id ? "bg-primary text-black" : "text-white/20 hover:text-white/40"
                            )}
                        >
                            <t.icon className="w-3 h-3" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* FILTERED MATCHES SECTION */}
                <div className="mb-12">
                    {filter === 'LIVE' && (
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Em Andamento</h2>
                                <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 italic">PARTIDAS AO VIVO</p>
                            </div>
                        </div>
                    )}

                    {filter === 'FINISHED' && (
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20">
                                <Trophy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Encerrados</h2>
                                <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 italic">RESULTADOS FINAIS</p>
                            </div>
                        </div>
                    )}

                    {filter === 'SCHEDULED' && (
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10">
                                <Clock className="w-5 h-5 text-white/40" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Próximos Jogos</h2>
                                <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 italic">CALENDÁRIO DA COPA</p>
                            </div>
                        </div>
                    )}

                    {matches.filter(m => m.status === filter).length === 0 ? (
                        <div className="glass-panel p-10 rounded-[3rem] border border-white/5 text-center bg-white/[0.01]">
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] italic leading-relaxed px-6">
                                Nenhuma partida {filter === 'LIVE' ? 'ao vivo' : filter === 'FINISHED' ? 'encerrada' : 'agendada'} no momento
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {(filter === 'SCHEDULED'
                                ? Object.entries(groupedScheduled).flatMap(([title, mms]) => mms.length > 0 ? [{ title }, ...mms] : [])
                                : matches.filter(m => m.status === filter)
                            ).map((item: any, idx) => {
                                if (item.title) {
                                    return (
                                        <div key={`title-${idx}`} className="flex items-center gap-4 pt-6 pb-2">
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                            <span className="text-[10px] font-black text-primary/60 uppercase italic tracking-[0.4em]">{item.title}</span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                        </div>
                                    );
                                }
                                return renderMatchCard(item, filter === 'LIVE');
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
