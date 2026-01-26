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
    const { teamA, teamB } = match;

    if (!teamA || !teamB) return null;

    if (isVertical) {
        return (
            <div className="relative w-full glass-panel rounded-2xl p-2.5 mb-4 border border-white/5 shadow-xl overflow-hidden group/card transition-all">
                {/* Minimal Header */}
                <div className="flex justify-between items-center text-[6px] uppercase font-black text-white/20 mb-2.5 tracking-widest italic relative z-10">
                    <span className="flex items-center gap-1"><div className="w-1 h-1 bg-primary rounded-full animate-pulse" /> {match.phase === 'GROUP' ? `R${match.round}` : match.phase}</span>
                    <span className="bg-white/5 px-1.5 py-0.5 rounded-full border border-white/10">{match.startTime}</span>
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
                                    "w-14 h-11 rounded-lg flex items-center justify-center border transition-all overflow-hidden bg-black flex-shrink-0 shadow-inner",
                                    isSelected ? "border-primary/40" : "border-white/5"
                                )}>
                                    {team.logoUrl ? (
                                        <img src={team.logoUrl} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <span className="text-white/10 font-black text-[8px] uppercase italic">{team.name.substring(0, 3)}</span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-tight italic transition-colors truncate text-left flex-1",
                                    isSelected ? "text-primary" : "text-white/40 group-hover/team:text-white"
                                )}>
                                    {team.name}
                                </span>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                    isSelected ? "bg-primary border-primary shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "bg-black/20 border-white/10"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-black stroke-[4px]" />}
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
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                    <span>{match.phase === 'GROUP' ? `Grupo ${match.group} - Rodada ${match.round}` : match.phase}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <span className="text-white/40">{match.startTime}</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 relative z-10">

                {/* Team A */}
                <button
                    onClick={() => !disabled && onSelect(teamA.id)}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-8 p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group/team",
                        selection === teamA.id
                            ? "bg-primary/20 border-primary/50 shadow-[0_0_40px_rgba(250,204,21,0.2)] scale-[1.03]"
                            : "bg-zinc-950/50 border-white/5 hover:border-white/10 hover:bg-white/5",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className={cn(
                        "w-full h-28 rounded-3xl flex items-center justify-center border transition-all duration-500 overflow-hidden bg-black/40",
                        selection === teamA.id ? "border-primary/40 shadow-inner shadow-primary/20" : "border-white/5"
                    )}>
                        {teamA.logoUrl ? (
                            <img src={teamA.logoUrl} className={cn("w-full h-full object-contain p-4 transition-transform duration-700", selection === teamA.id && "scale-110")} />
                        ) : (
                            <span className="text-white/10 font-black text-xl uppercase italic">{teamA.name.substring(0, 3)}</span>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <span className={cn(
                            "text-base font-black uppercase tracking-[0.2em] italic transition-colors text-center px-1 leading-tight",
                            selection === teamA.id ? "text-primary" : "text-white/60 group-hover/team:text-white"
                        )}>
                            {teamA.name}
                        </span>

                        {/* Selection Circle */}
                        <div className={cn(
                            "w-12 h-12 rounded-full border-[3px] flex items-center justify-center transition-all duration-500",
                            selection === teamA.id
                                ? "bg-primary border-primary shadow-[0_0_20px_rgba(250,204,21,0.6)] rotate-0"
                                : "bg-black/40 border-white/10 group-hover/team:border-white/20 -rotate-90"
                        )}>
                            {selection === teamA.id ? (
                                <Check className="w-6 h-6 text-black stroke-[5px]" />
                            ) : (
                                <div className="w-2.5 h-2.5 bg-white/10 rounded-full group-hover/team:bg-white/20" />
                            )}
                        </div>
                    </div>
                </button>

                {/* VS Divider */}
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                    <span className="text-2xl font-black text-primary italic tracking-tighter drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse">VS</span>
                    <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                </div>

                {/* Team B */}
                <button
                    onClick={() => !disabled && onSelect(teamB.id)}
                    className={cn(
                        "flex-1 flex flex-col items-center gap-8 p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group/team",
                        selection === teamB.id
                            ? "bg-primary/20 border-primary/50 shadow-[0_0_40px_rgba(250,204,21,0.2)] scale-[1.03]"
                            : "bg-zinc-950/50 border-white/5 hover:border-white/10 hover:bg-white/5",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className={cn(
                        "w-full h-28 rounded-3xl flex items-center justify-center border transition-all duration-500 overflow-hidden bg-black/40",
                        selection === teamB.id ? "border-primary/40 shadow-inner shadow-primary/20" : "border-white/5"
                    )}>
                        {teamB.logoUrl ? (
                            <img src={teamB.logoUrl} className={cn("w-full h-full object-contain p-4 transition-transform duration-700", selection === teamB.id && "scale-110")} />
                        ) : (
                            <span className="text-white/10 font-black text-xl uppercase italic">{teamB.name.substring(0, 3)}</span>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <span className={cn(
                            "text-base font-black uppercase tracking-[0.2em] italic transition-colors text-center px-1 leading-tight",
                            selection === teamB.id ? "text-primary" : "text-white/60 group-hover/team:text-white"
                        )}>
                            {teamB.name}
                        </span>

                        {/* Selection Circle */}
                        <div className={cn(
                            "w-12 h-12 rounded-full border-[3px] flex items-center justify-center transition-all duration-500",
                            selection === teamB.id
                                ? "bg-primary border-primary shadow-[0_0_20px_rgba(250,204,21,0.6)] rotate-0"
                                : "bg-black/40 border-white/10 group-hover/team:border-white/20 -rotate-90"
                        )}>
                            {selection === teamB.id ? (
                                <Check className="w-6 h-6 text-black stroke-[5px]" />
                            ) : (
                                <div className="w-2.5 h-2.5 bg-white/10 rounded-full group-hover/team:bg-white/20" />
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
