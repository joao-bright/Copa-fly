'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getMatches } from '@/lib/data';
import { ArrowLeft, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RankingPage() {
    const router = useRouter();
    const [leaderBoard, setLeaderBoard] = useState<{ name: string, cpf: string, points: number, me: boolean }[]>([]);
    const [userCpf, setUserCpf] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedCpf = localStorage.getItem('copa_user_cpf');
        setUserCpf(storedCpf);

        const fetchData = async () => {
            const matches = await getMatches();
            const { data: tickets } = await supabase.from('tickets').select('*, bets(*)');

            if (!tickets) return;

            const winnersMap: Record<string, string> = {};
            matches.forEach(m => { if (m.winnerId) winnersMap[m.id] = m.winnerId; });

            const scores: Record<string, { points: number, name: string }> = {};
            tickets.forEach(t => {
                if (!scores[t.cpf]) scores[t.cpf] = { points: 0, name: t.customer_name || 'Usuário Fly' };
                t.bets.forEach((b: any) => {
                    if (winnersMap[b.match_id] === b.selected_team_id) {
                        scores[t.cpf].points += 1;
                    }
                });
            });

            const board = Object.entries(scores)
                .map(([cpf, data]) => ({
                    name: data.name,
                    cpf: cpf.substring(0, 3) + '.***.***-' + cpf.substring(cpf.length - 2),
                    fullCpf: cpf,
                    points: data.points,
                    me: cpf === storedCpf
                }))
                .sort((a, b) => b.points - a.points)
                .slice(0, 20);

            setLeaderBoard(board as any);
            setLoading(false);
        };

        fetchData();
    }, []);

    const myPos = leaderBoard.findIndex(u => u.me) + 1;

    return (
        <main className="min-h-screen p-4 pb-48 max-w-md mx-auto relative">
            <div className="flex items-center gap-4 mb-8 pt-4">
                <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">Ranking Top 10</h1>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                <div className="bg-primary/20 p-6 flex items-center justify-between border-b border-primary/20">
                    <div className="flex items-center gap-3">
                        <Trophy className="text-primary w-8 h-8" />
                        <div>
                            <h3 className="text-primary font-black uppercase text-sm italic">Líderes da Copa</h3>
                            <p className="text-primary/60 text-[10px] uppercase font-bold tracking-widest">Atualizado em tempo real</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-black text-white italic">#{myPos > 0 ? myPos.toString().padStart(2, '0') : '--'}</span>
                        <span className="text-[8px] text-white/40 uppercase font-black">Sua Posição</span>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {leaderBoard.map((user, index) => (
                        <div
                            key={index}
                            className={cn(
                                "p-5 flex items-center justify-between transition-colors",
                                user.me ? "bg-white/10" : "hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-black italic text-sm border",
                                    index === 0 ? "bg-yellow-500 border-yellow-400 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]" :
                                        index === 1 ? "bg-slate-300 border-white text-black" :
                                            index === 2 ? "bg-amber-700 border-amber-600 text-white" :
                                                "bg-black/50 border-white/10 text-white/40"
                                )}>
                                    {index + 1}
                                </div>
                                <div>
                                    <span className="text-sm font-bold uppercase italic text-white/40">
                                        Palpiteiro #{index + 1}
                                    </span>
                                    <span className="block text-[8px] text-primary font-black tracking-widest">{user.cpf}</span>
                                    {user.me && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-black">Você</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black italic text-white">{user.points}</span>
                                <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter mt-1">Acertos</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <p className="mt-8 text-[10px] text-white/20 text-center uppercase font-bold tracking-widest leading-relaxed">
                * Em caso de empate, o prêmio final será dividido igualmente entre os primeiros colocados.
            </p>
        </main>
    );
}
