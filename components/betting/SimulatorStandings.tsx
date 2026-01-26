'use client';

import { Team, Match } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy, X } from 'lucide-react';

interface StandingTeam extends Team {
    points: number;
    wins: number;
}

interface SimulatorStandingsProps {
    teams: Team[];
    selections: Record<string, string>;
    group: string;
    matches: Match[];
    isMobile?: boolean; // Now means side-by-side or condensed
    onClose?: () => void;
}

export default function SimulatorStandings({ teams, selections, group, matches, isMobile, onClose }: SimulatorStandingsProps) {
    const groupTeams = teams.filter(t => t.group === group);

    // Calculate standings based on user selections
    const standings: StandingTeam[] = groupTeams.map(team => {
        let points = 0;
        let wins = 0;

        // Filter group matches for this team
        const teamGroupMatches = matches.filter(m =>
            m.group === group && (m.teamA?.id === team.id || m.teamB?.id === team.id)
        );

        teamGroupMatches.forEach(m => {
            const selectedWinnerId = selections[m.id];
            if (selectedWinnerId === team.id) {
                points += 3;
                wins += 1;
            }
        });

        return { ...team, points, wins };
    });

    // Sort by points, then wins, then name
    const sortedStandings = standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className={cn(
            "glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl transition-all duration-700",
            isMobile ? "bg-black/90" : "animate-in fade-in slide-in-from-top-4"
        )}>
            <div className="bg-white/[0.03] px-3 py-2 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-[7.5px] font-black uppercase tracking-[0.1em] italic text-primary flex items-center gap-1.5">
                    <Trophy className="w-2.5 h-2.5 text-primary" /> Grupo {group}
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors active:scale-90">
                        <X className="w-3 h-3 text-white/40" />
                    </button>
                )}
            </div>

            <div className="p-1">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[6px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">
                            <th className="px-2 py-1.5 w-6">#</th>
                            <th className="px-1 py-1.5">Time</th>
                            <th className="px-2 py-1.5 text-right">P</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {sortedStandings.map((team, idx) => {
                            const isTopTwo = idx < 2;
                            return (
                                <tr key={team.id} className={cn(
                                    "transition-colors",
                                    isTopTwo ? "bg-primary/5" : ""
                                )}>
                                    <td className="px-2 py-2">
                                        <div className={cn(
                                            "w-4 h-4 rounded flex items-center justify-center text-[7px] font-black border transition-all",
                                            idx === 0 ? "bg-primary text-black border-primary shadow-[0_0_8px_rgba(250,204,21,0.2)]" :
                                                idx === 1 ? "bg-white/10 text-white border-white/10" :
                                                    "bg-zinc-900 text-white/10 border-white/5"
                                        )}>
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-1 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-3.5 bg-black rounded border border-white/5 overflow-hidden flex items-center justify-center">
                                                {team.logoUrl ? (
                                                    <img src={team.logoUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[5px] font-black text-white/20 uppercase">{team.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase italic tracking-tight transition-colors truncate max-w-[60px]",
                                                isTopTwo ? "text-white" : "text-white/30"
                                            )}>
                                                {team.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        <span className={cn(
                                            "text-[10px] font-black italic",
                                            isTopTwo ? "text-primary drop-shadow-[0_0_5px_rgba(250,204,21,0.3)]" : "text-white/20"
                                        )}>{team.points}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
