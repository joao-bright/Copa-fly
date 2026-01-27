'use client';

import { Match, Team } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy, Check } from 'lucide-react';

interface GameCardProps {
    match: Match;
    selection: string | null; // teamId
    onSelect: (teamId: string) => void;
    disabled?: boolean;
    isVertical?: boolean;
}

export default function GameCard({ match, selection, onSelect, disabled, isVertical }: GameCardProps) {
    const { teamA, teamB, status, winnerId, scoreA, scoreB } = match;

    if (!teamA || !teamB) return null;

    const isFinished = status === 'FINISHED';
    const isLive = status === 'LIVE';
    const isLocked = disabled || isFinished || isLive;

    if (isVertical) {
        return (
            <div className="relative w-full glass-panel rounded-2xl p-2.5 mb-4 border border-white/5 shadow-xl overflow-hidden group/card transition-all">
                {/* Minimal Header */}
                <div className="flex justify-between items-center text-[6px] uppercase font-black text-white/20 mb-2.5 tracking-widest italic relative z-10">
                    <span className="flex items-center gap-1">
                        <div className={cn("w-1 h-1 rounded-full animate-pulse", isLive ? "bg-red-500" : isFinished ? "bg-white/20" : "bg-primary")} />
                        {isLive ? 'AO VIVO' : isFinished ? 'ENCERRADO' : match.phase === 'GROUP' ? `R${match.round}` : match.phase}
                    </span>
                    <span className="bg-white/5 px-1.5 py-0.5 rounded-full border border-white/10">{isLive || isFinished ? `${scoreA ?? 0} x ${scoreB ?? 0}` : match.startTime}</span>
                </div>

                <div className="flex flex-col gap-2 relative z-10">
                    {[teamA, teamB].map((team, idx) => {
                        const isSelected = selection === team.id;
                        return (
                            <button
                                key={team.id}
                                onClick={() => !disabled && onSelect(team.id)}
                                className={cn(
                                    "w-full flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 relative overflow-hidden group/team",
                                    isSelected
                                        ? "bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(250,204,21,0.1)] scale-[1.02]"
                                        : "bg-black/60 border-white/5 hover:border-white/10 hover:bg-white/5",
                                    disabled && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-6 rounded flex items-center justify-center border transition-all overflow-hidden bg-black flex-shrink-0 shadow-inner",
                                    isSelected ? "border-primary/40" : "border-white/5"
                                )}>
                                    {team.logoUrl ? (
                                        <img src={team.logoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white/10 font-black text-[6px] uppercase italic">{team.name.substring(0, 3)}</span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-tight italic transition-colors truncate text-left flex-1",
                                    isSelected ? "text-primary" : "text-white/40 group-hover/team:text-white"
                                )}>
                                    {team.name}
                                </span>
                                <div className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                    isSelected ? "bg-primary border-primary shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "bg-black/20 border-white/10"
                                )}>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[4px]" />}
                                </div>
                            </button>
                        );
                    })}
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

    // Default Horizontal Layout
    return (
        <div className="relative w-full glass-panel rounded-[2rem] p-5 mb-6 border border-white/5 shadow-2xl overflow-hidden group/card">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Header (Phase/Time) */}
            <div className="flex justify-between items-center text-[8px] uppercase font-black text-white/20 mb-6 tracking-[0.3em] italic relative z-10">
                <div className="flex items-center gap-2">
                    <div className={cn("w-1 h-1 rounded-full animate-pulse", isLive ? "bg-red-500" : isFinished ? "bg-white/20" : "bg-primary")} />
                    <span>{isLive ? 'PARTIDA AO VIVO' : isFinished ? 'RESULTADO FINAL' : match.phase === 'GROUP' ? `Grupo ${match.group} - Rodada ${match.round}` : match.phase}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <span className="text-white/40">{isLive || isFinished ? `${scoreA ?? 0} x ${scoreB ?? 0}` : match.startTime}</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 relative z-10">

                {/* Team A */}
                <button
                    onClick={() => !isLocked && onSelect(teamA.id)}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-6 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden group/team",
                        selection === teamA.id
                            ? "bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(250,204,21,0.15)] scale-[1.02]"
                            : "bg-zinc-950/50 border-white/5 hover:border-white/10 hover:bg-white/5",
                        isLocked && selection !== teamA.id && "opacity-20 cursor-not-allowed",
                        isLocked && selection === teamA.id && "border-primary/20"
                    )}
                >
                    <div className={cn(
                        "w-full aspect-[1792/768] rounded-2xl flex items-center justify-center border transition-all duration-500 overflow-hidden bg-black",
                        selection === teamA.id ? "border-primary/40 shadow-inner shadow-primary/10" : "border-white/5"
                    )}>
                        {teamA.logoUrl ? (
                            <img src={teamA.logoUrl} className={cn("w-full h-full object-cover transition-transform duration-700", selection === teamA.id && "scale-110")} />
                        ) : (
                            <span className="text-white/10 font-black text-sm uppercase italic">{teamA.name.substring(0, 3)}</span>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <span className={cn(
                            "text-[12px] font-black uppercase tracking-[0.15em] italic transition-colors text-center px-1 leading-tight",
                            selection === teamA.id ? "text-primary" : "text-white/60 group-hover/team:text-white"
                        )}>
                            {teamA.name}
                        </span>

                        {/* Selection Circle */}
                        <div className={cn(
                            "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                            selection === teamA.id
                                ? "bg-primary border-primary shadow-[0_0_15px_rgba(250,204,21,0.5)] rotate-0"
                                : "bg-black/40 border-white/10 group-hover/team:border-white/20 -rotate-90"
                        )}>
                            {selection === teamA.id ? (
                                <Check className="w-5 h-5 text-black stroke-[4px]" />
                            ) : (
                                <div className="w-2 h-2 bg-white/10 rounded-full group-hover/team:bg-white/20" />
                            )}
                        </div>
                    </div>
                </button>

                {/* VS Divider */}
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                    <span className="text-lg font-black text-primary italic tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.3)] animate-pulse">VS</span>
                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                </div>

                {/* Team B */}
                <button
                    onClick={() => !isLocked && onSelect(teamB.id)}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-6 p-6 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden group/team",
                        selection === teamB.id
                            ? "bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(250,204,21,0.15)] scale-[1.02]"
                            : "bg-zinc-950/50 border-white/5 hover:border-white/10 hover:bg-white/5",
                        isLocked && selection !== teamB.id && "opacity-20 cursor-not-allowed",
                        isLocked && selection === teamB.id && "border-primary/20"
                    )}
                >
                    <div className={cn(
                        "w-full aspect-[1792/768] rounded-2xl flex items-center justify-center border transition-all duration-500 overflow-hidden bg-black",
                        selection === teamB.id ? "border-primary/40 shadow-inner shadow-primary/10" : "border-white/5"
                    )}>
                        {teamB.logoUrl ? (
                            <img src={teamB.logoUrl} className={cn("w-full h-full object-cover transition-transform duration-700", selection === teamB.id && "scale-110")} />
                        ) : (
                            <span className="text-white/10 font-black text-sm uppercase italic">{teamB.name.substring(0, 3)}</span>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <span className={cn(
                            "text-[12px] font-black uppercase tracking-[0.15em] italic transition-colors text-center px-1 leading-tight",
                            selection === teamB.id ? "text-primary" : "text-white/60 group-hover/team:text-white"
                        )}>
                            {teamB.name}
                        </span>

                        {/* Selection Circle */}
                        <div className={cn(
                            "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                            selection === teamB.id
                                ? "bg-primary border-primary shadow-[0_0_15px_rgba(250,204,21,0.5)] rotate-0"
                                : "bg-black/40 border-white/10 group-hover/team:border-white/20 -rotate-90"
                        )}>
                            {selection === teamB.id ? (
                                <Check className="w-5 h-5 text-black stroke-[4px]" />
                            ) : (
                                <div className="w-2 h-2 bg-white/10 rounded-full group-hover/team:bg-white/20" />
                            )}
                        </div>
                    </div>
                </button>

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
