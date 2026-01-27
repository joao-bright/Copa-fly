'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTicketById, getMatches, getTeams } from '@/lib/data';
import { Match, Team, Ticket } from '@/lib/types';
import BracketVisual from '@/components/betting/BracketVisual';
import { Trophy, ArrowLeft, Calendar, User, ShieldCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TicketDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'SIMULADOR' | 'RESULTADOS'>('SIMULADOR');

    useEffect(() => {
        const fetchData = async () => {
            const [tRes, mRes, teamsRes] = await Promise.all([
                getTicketById(id as string),
                getMatches(),
                getTeams()
            ]);
            setTicket(tRes);
            setMatches(mRes);
            setTeams(teamsRes);
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Carregando Bilhete...</span>
        </div>
    );

    if (!ticket) return <div>Bilhete não encontrado.</div>;

    // Prepare bracket data for visualization
    // We need to figure out who the bracket teams are based on the ticket's group matches
    // But since it's a fixed visualization of the saved picks:
    const selections = ticket.bets.reduce((acc, bet) => {
        if (bet.matchId && bet.selectedTeamId) {
            acc[bet.matchId] = bet.selectedTeamId;
        }
        return acc;
    }, {} as Record<string, string>);

    const calculateTicketStandings = (group: string) => {
        const groupTeams = teams.filter(t => t.group === group);
        const standings = groupTeams.map(team => {
            let pts = 0;
            let wins = 0;
            ticket.bets.forEach(bet => {
                const m = matches.find(m => m.id === bet.matchId);
                // Check if the match belongs to this group and the team is part of the match
                const matchInGroup = m?.group === group || (m && (m.teamA?.id === team.id || m.teamB?.id === team.id));
                if (m && matchInGroup && (m.teamA?.id === team.id || m.teamB?.id === team.id)) {
                    if (bet.selectedTeamId === team.id) {
                        pts += 3;
                        wins += 1;
                    }
                }
            });
            return { ...team, points: pts, wins };
        });

        return standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.name.localeCompare(b.name);
        });
    };

    const standingsA = calculateTicketStandings('A');
    const standingsB = calculateTicketStandings('B');

    const bracketTeams = {
        a1: standingsA[0] || null,
        a2: standingsA[1] || null,
        b1: standingsB[0] || null,
        b2: standingsB[1] || null
    };

    const renderResultados = () => {
        // Sort matches by round/phase
        const round1 = matches.filter(m => m.phase === 'GROUP' && m.round === 1);
        const round2 = matches.filter(m => m.phase === 'GROUP' && m.round === 2);
        const round3 = matches.filter(m => m.phase === 'GROUP' && m.round === 3);
        const semis = matches.filter(m => m.phase === 'SEMI');
        const final = matches.filter(m => m.phase === 'FINAL');

        const renderMatchRow = (m: Match, label: string) => {
            const selectedId = selections[m.id];
            const isTeamASelected = m.teamA?.id === selectedId;
            const isTeamBSelected = m.teamB?.id === selectedId;
            const winnerId = m.winnerId;

            return (
                <div key={m.id} className="flex flex-col gap-3 py-4 border-b border-white/[0.03] last:border-0 group">
                    <div className="flex justify-between items-center text-[7px] font-black text-white/20 uppercase tracking-[0.3em] italic">
                        <span>{label}</span>
                        <span>{m.startTime}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Team A */}
                        <div className={cn(
                            "flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all",
                            isTeamASelected ? "bg-primary/10 border-primary/30" : "bg-zinc-900/30 border-white/5"
                        )}>
                            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center border border-white/5">
                                {m.teamA?.logoUrl ? <img src={m.teamA.logoUrl} className="w-4 h-4 object-contain" /> : <ShieldCheck className="w-3 h-3 text-white/10" />}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase italic tracking-tighter truncate",
                                isTeamASelected ? "text-primary" : "text-white/40"
                            )}>
                                {m.teamA?.name}
                            </span>
                        </div>

                        <div className="text-[8px] font-black text-white/10 italic">VS</div>

                        {/* Team B */}
                        <div className={cn(
                            "flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all",
                            isTeamBSelected ? "bg-primary/10 border-primary/30" : "bg-zinc-900/30 border-white/5"
                        )}>
                            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center border border-white/5">
                                {m.teamB?.logoUrl ? <img src={m.teamB.logoUrl} className="w-4 h-4 object-contain" /> : <ShieldCheck className="w-3 h-3 text-white/10" />}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase italic tracking-tighter truncate",
                                isTeamBSelected ? "text-primary" : "text-white/40"
                            )}>
                                {m.teamB?.name}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-1.5">
                            <Star className={cn("w-3 h-3", winnerId ? "text-primary fill-primary" : "text-white/5")} />
                            <span className="text-[8px] font-black text-white/30 uppercase italic tracking-widest leading-none">
                                {winnerId ? "Resultado Final" : "Aguardando Resultado"}
                            </span>
                        </div>
                        {winnerId && (
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase italic",
                                winnerId === selectedId ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                            )}>
                                {winnerId === selectedId ? "ACERTOU!" : "ERROU"}
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        const renderSection = (title: string, matches: Match[]) => (
            <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-primary/60 uppercase italic tracking-[0.3em] font-sans">{title}</span>
                    <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="space-y-2">
                    {matches.map(m => renderMatchRow(m, title))}
                </div>
            </div>
        );

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {renderSection("RODADA 1", round1)}
                {renderSection("RODADA 2", round2)}
                {renderSection("RODADA 3", round3)}
                {renderSection("SEMI-FINAIS", semis)}
                {renderSection("GRANDE FINAL", final)}
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-black p-6 pb-20 overflow-x-hidden">
            <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all">
                <ArrowLeft className="w-3 h-3 text-primary" /> Meus Bilhetes
            </button>

            <div className="max-w-md mx-auto space-y-8">
                <div className="text-center mb-6">
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">DETALHES DO BILHETE</h1>

                    <div className="mt-6 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] leading-none">STATUS ATUAL</span>
                                <div className="text-primary font-black italic uppercase tracking-tighter bg-primary/10 px-5 py-2 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                                    <span className="text-2xl leading-none">
                                        {ticket.bets.reduce((acc, b) => {
                                            const m = matches.find(match => match.id === b.matchId);
                                            if (m && m.winnerId && m.winnerId === b.selectedTeamId) return acc + 1;
                                            return acc;
                                        }, 0)}
                                    </span>
                                    <span className="text-xs opacity-40 ml-1">/{matches.length} ACERTOS</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em] flex items-center gap-2 leading-none">
                                <Calendar className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] italic mt-1 opacity-40">ID: {ticket.id.slice(0, 8)}</div>
                        </div>
                    </div>
                </div>

                {/* Tab Controls */}
                <div className="flex p-1.5 bg-zinc-900/50 rounded-2xl border border-white/5 mb-10">
                    <button
                        onClick={() => setActiveTab('SIMULADOR')}
                        className={cn(
                            "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                            activeTab === 'SIMULADOR' ? "bg-primary text-black shadow-lg" : "text-white/20 hover:text-white/40"
                        )}
                    >
                        SIMULADOR
                    </button>
                    <button
                        onClick={() => setActiveTab('RESULTADOS')}
                        className={cn(
                            "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                            activeTab === 'RESULTADOS' ? "bg-primary text-black shadow-lg" : "text-white/20 hover:text-white/40"
                        )}
                    >
                        RESULTADOS
                    </button>
                </div>

                {activeTab === 'SIMULADOR' ? (
                    <BracketVisual selections={selections} bracket={bracketTeams} standingsA={standingsA} standingsB={standingsB} matches={matches} />
                ) : (
                    renderResultados()
                )}

                {/* Optional: Add a share button or a high-res download hint */}
                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 text-center bg-white/[0.02] mt-10">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest italic mb-4">Compartilhe sua sorte!</p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-primary/10 border border-primary/20 p-3 rounded-2xl text-primary active:scale-95 transition-all">
                            <Star className="w-5 h-5 fill-primary" />
                        </button>
                    </div>
                </div>
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
