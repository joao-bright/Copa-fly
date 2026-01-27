'use client';

import { useState } from 'react';
import { Match, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy, Star, ShieldCheck } from 'lucide-react';

interface BracketVisualProps {
    selections: Record<string, string>;
    bracket: {
        a1: Team | null;
        a2: Team | null;
        b1: Team | null;
        b2: Team | null;
    };
    standingsA?: any[];
    standingsB?: any[];
    matches?: Match[];
    ticketIdx?: number;
}

export default function BracketVisual({ selections, bracket, standingsA, standingsB, matches, ticketIdx }: BracketVisualProps) {
    const [expandedGroup, setExpandedGroup] = useState<'A' | 'B' | null>(null);

    // Resolve IDs: support both derived (simulator) and UUIDs (saved tickets)
    let s1WinnerId = selections['derived_s1'];
    let s2WinnerId = selections['derived_s2'];
    let finalWinnerId = selections['derived_f1'];

    const s1Record = matches?.find(m => m.phase === 'SEMI' && (m.startTime === '14:00' || m.startTime === '12:00'));
    const s2Record = matches?.find(m => m.phase === 'SEMI' && (m.startTime === '15:00' || m.startTime === '13:00'));
    const finalRecord = matches?.find(m => m.phase === 'FINAL');

    if (matches) {
        if (s1Record && selections[s1Record.id]) s1WinnerId = selections[s1Record.id];
        if (s2Record && selections[s2Record.id]) s2WinnerId = selections[s2Record.id];
        if (finalRecord && selections[finalRecord.id]) finalWinnerId = selections[finalRecord.id];
    }

    const s1WinnerIdResolved = (s1Record?.status !== 'SCHEDULED' && s1Record?.winnerId) ? s1Record.winnerId : s1WinnerId;
    const s2WinnerIdResolved = (s2Record?.status !== 'SCHEDULED' && s2Record?.winnerId) ? s2Record.winnerId : s2WinnerId;
    const finalWinnerIdResolved = (finalRecord?.status !== 'SCHEDULED' && finalRecord?.winnerId) ? finalRecord.winnerId : finalWinnerId;

    const s1Winner = s1WinnerIdResolved ? (s1WinnerIdResolved === bracket.a1?.id ? bracket.a1 : bracket.b2) : null;
    const s2Winner = s2WinnerIdResolved ? (s2WinnerIdResolved === bracket.b1?.id ? bracket.b1 : bracket.a2) : null;
    const champion = finalWinnerIdResolved ? (finalWinnerIdResolved === s1Winner?.id ? s1Winner : s2Winner) : null;

    return (
        <div className="w-full glass-panel rounded-[3rem] p-6 sm:p-8 border border-white/10 shadow-3xl relative overflow-hidden bg-black/40">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy className="w-32 h-32" /></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />

            <div className="text-center mb-8 relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <img src="/logo.jpg" alt="Fly Cup" className="w-6 h-6 object-contain rounded-full border border-primary/20" />
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] italic block">
                        {ticketIdx !== undefined ? `Bilhete 0${ticketIdx + 1}` : 'Seu Palpite'}
                    </span>
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Simulador Copa Fly</h3>
            </div>

            <div className="space-y-12 relative z-10">
                {/* Group Phase Standings */}
                {standingsA && standingsB && (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Group A */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[8px] font-black text-primary uppercase tracking-widest italic">Grupo A</span>
                                    <span className="text-[6px] text-white/20 font-black uppercase italic">PTS</span>
                                </div>
                                <div className="space-y-1 bg-white/5 rounded-2xl p-2 border border-white/5 backdrop-blur-sm">
                                    {standingsA.map((team, idx) => (
                                        <div key={team.id} className={cn("flex items-center justify-between p-1.5 rounded-lg", idx < 2 ? "bg-primary/5" : "")}>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className={cn("text-[7px] font-black w-3", idx < 2 ? "text-primary" : "text-white/20")}>{idx + 1}</span>
                                                <div className="w-3.5 h-3.5 bg-black rounded-sm border border-white/10 overflow-hidden flex-shrink-0">
                                                    {team.logoUrl && <img src={team.logoUrl} className="w-full h-full object-cover" />}
                                                </div>
                                                <span className={cn("text-[8px] font-black uppercase italic truncate", idx < 2 ? "text-white" : "text-white/40")}>{team.name}</span>
                                            </div>
                                            <span className={cn("text-[8px] font-black italic", idx < 2 ? "text-primary" : "text-white/20")}>{team.points}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setExpandedGroup(expandedGroup === 'A' ? null : 'A')}
                                    className="w-full py-2 rounded-xl bg-primary text-[8px] font-black uppercase text-black hover:opacity-90 transition-all active:scale-95 shadow-[0_5px_15px_rgba(250,204,21,0.2)]"
                                >
                                    {expandedGroup === 'A' ? 'Ocultar Palpites' : 'Ver Palpites'}
                                </button>
                            </div>

                            {/* Group B */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[8px] font-black text-primary uppercase tracking-widest italic">Grupo B</span>
                                    <span className="text-[6px] text-white/20 font-black uppercase italic">PTS</span>
                                </div>
                                <div className="space-y-1 bg-white/5 rounded-2xl p-2 border border-white/5 backdrop-blur-sm">
                                    {standingsB.map((team, idx) => (
                                        <div key={team.id} className={cn("flex items-center justify-between p-1.5 rounded-lg", idx < 2 ? "bg-primary/5" : "")}>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className={cn("text-[7px] font-black w-3", idx < 2 ? "text-primary" : "text-white/20")}>{idx + 1}</span>
                                                <div className="w-3.5 h-3.5 bg-black rounded-sm border border-white/10 overflow-hidden flex-shrink-0">
                                                    {team.logoUrl && <img src={team.logoUrl} className="w-full h-full object-cover" />}
                                                </div>
                                                <span className={cn("text-[8px] font-black uppercase italic truncate", idx < 2 ? "text-white" : "text-white/40")}>{team.name}</span>
                                            </div>
                                            <span className={cn("text-[8px] font-black italic", idx < 2 ? "text-primary" : "text-white/20")}>{team.points}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setExpandedGroup(expandedGroup === 'B' ? null : 'B')}
                                    className="w-full py-2 rounded-xl bg-primary text-[8px] font-black uppercase text-black hover:opacity-90 transition-all active:scale-95 shadow-[0_5px_15px_rgba(250,204,21,0.2)]"
                                >
                                    {expandedGroup === 'B' ? 'Ocultar Palpites' : 'Ver Palpites'}
                                </button>
                            </div>
                        </div>

                        {/* Expanded Picks */}
                        {expandedGroup && matches && (
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 animate-in slide-in-from-top-2 duration-500">
                                <div className="text-[7px] font-black text-primary/60 uppercase tracking-widest italic mb-3 text-center">Seus Vencedores - Grupo {expandedGroup}</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {matches.filter(m => m.group === expandedGroup).map(match => {
                                        const winnerId = selections[match.id];
                                        const winnerTeam = match.teamA?.id === winnerId ? match.teamA : match.teamB;
                                        return (
                                            <div key={match.id} className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 opacity-40 grayscale">
                                                        {match.teamA?.logoUrl && <img src={match.teamA.logoUrl} className="w-2.5 h-2.5" />}
                                                        <span className="text-[5px] font-black uppercase">{match.teamA?.name}</span>
                                                    </div>
                                                    <span className="text-[5px] text-white/10">vs</span>
                                                    <div className="flex items-center gap-1 opacity-40 grayscale">
                                                        {match.teamB?.logoUrl && <img src={match.teamB.logoUrl} className="w-2.5 h-2.5" />}
                                                        <span className="text-[5px] font-black uppercase">{match.teamB?.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 pl-3 border-l border-white/5">
                                                    <span className="text-[5px] text-white/20 font-black uppercase">Palpite:</span>
                                                    <span className="text-[7px] text-primary font-black uppercase italic">{winnerTeam?.name}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bracket Section */}
                <div className="space-y-8">
                    <div className="text-center">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] italic">Fase Eliminatória</span>
                    </div>

                    <div className="flex flex-col items-center gap-8">
                        {/* Semi-Finals Row */}
                        <div className="flex justify-between w-full gap-4">
                            {/* Semi 1 */}
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="text-[7px] font-black text-white/20 uppercase tracking-widest text-center italic leading-none">Semi 01</div>
                                <div className="space-y-1.5 backdrop-blur-md bg-white/5 rounded-2xl p-2.5 border border-white/5 shadow-xl relative">
                                    <div className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", s1WinnerId === bracket.a1?.id ? "bg-primary/10 border-primary/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]" : "border-transparent opacity-40")}>
                                        <div className="w-4 h-4 bg-black rounded-sm border border-white/10 overflow-hidden flex-shrink-0">
                                            {bracket.a1?.logoUrl && <img src={bracket.a1.logoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-[8px] font-black uppercase italic truncate">{bracket.a1?.name || '?'}</span>
                                    </div>
                                    <div className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", s1WinnerId === bracket.b2?.id ? "bg-primary/10 border-primary/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]" : "border-transparent opacity-40")}>
                                        <div className="w-4 h-4 bg-black rounded-sm border border-white/10 overflow-hidden flex-shrink-0">
                                            {bracket.b2?.logoUrl && <img src={bracket.b2.logoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-[8px] font-black uppercase italic truncate">{bracket.b2?.name || '?'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Semi 2 */}
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="text-[7px] font-black text-white/20 uppercase tracking-widest text-center italic leading-none">Semi 02</div>
                                <div className="space-y-1.5 backdrop-blur-md bg-white/5 rounded-2xl p-2.5 border border-white/5 shadow-xl">
                                    <div className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", s2WinnerId === bracket.b1?.id ? "bg-primary/10 border-primary/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]" : "border-transparent opacity-40")}>
                                        <div className="w-4 h-4 bg-black rounded-sm border border-white/10 overflow-hidden flex-shrink-0">
                                            {bracket.b1?.logoUrl && <img src={bracket.b1.logoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-[8px] font-black uppercase italic truncate">{bracket.b1?.name || '?'}</span>
                                    </div>
                                    <div className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", s2WinnerId === bracket.a2?.id ? "bg-primary/10 border-primary/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]" : "border-transparent opacity-40")}>
                                        <div className="w-4 h-4 bg-black rounded-sm border border-white/10 overflow-hidden flex-shrink-0">
                                            {bracket.a2?.logoUrl && <img src={bracket.a2.logoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-[8px] font-black uppercase italic truncate">{bracket.a2?.name || '?'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connectors (CSS) */}
                        <div className="relative w-full h-8 flex justify-center -my-4">
                            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/10 to-primary/40" />
                            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-white/10 to-primary/40" />
                        </div>

                        {/* Final Row */}
                        <div className="w-full sm:w-2/3 flex flex-col gap-3">
                            <div className="text-[7px] font-black text-white/20 uppercase tracking-widest text-center italic leading-none">A Grande Final</div>
                            <div className="space-y-1.5 backdrop-blur-md bg-primary/5 rounded-[2rem] p-4 border border-primary/20 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className={cn("flex items-center justify-between p-3 rounded-2xl border transition-all", finalWinnerId === s1Winner?.id ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]" : "border-transparent opacity-40")}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-5 bg-black rounded border border-white/10 overflow-hidden flex-shrink-0">
                                            {s1Winner?.logoUrl && <img src={s1Winner.logoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase italic tracking-wider truncate">{s1Winner?.name || '?'}</span>
                                    </div>
                                    {finalWinnerId === s1Winner?.id && <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                                </div>
                                <div className={cn("flex items-center justify-between p-3 rounded-2xl border transition-all", finalWinnerId === s2Winner?.id ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]" : "border-transparent opacity-40")}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-5 bg-black rounded border border-white/10 overflow-hidden flex-shrink-0">
                                            {s2Winner?.logoUrl && <img src={s2Winner.logoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase italic tracking-wider truncate">{s2Winner?.name || '?'}</span>
                                    </div>
                                    {finalWinnerId === s2Winner?.id && <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                                </div>
                            </div>
                        </div>

                        {/* Winner Reveal */}
                        {champion && (
                            <div className="mt-4 flex flex-col items-center animate-in zoom-in-50 fade-in duration-1000">
                                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.6)] border-4 border-black relative">
                                    <Star className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse fill-primary" />
                                    <Trophy className="w-10 h-10 text-black animate-bounce" />
                                </div>
                                <div className="mt-6 text-center">
                                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.5em] italic block mb-2">Vencedor Copa Fly</span>
                                    <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]">{champion.name}</h4>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .glass-panel {
                    background: rgba(10, 10, 10, 0.4);
                    backdrop-filter: blur(20px);
                }
            `}</style>
        </div>
    );
}
