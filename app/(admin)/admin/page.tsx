'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, Trophy, Download, RefreshCcw, TrendingUp, BarChart3, ShieldCheck, Percent, Ticket as TicketIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Ticket } from '@/lib/types';

export default function AdminDashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [houseRetention, setHouseRetention] = useState(35);
    const [guessesLocked, setGuessesLocked] = useState(false);

    const fetchData = async () => {
        const { data: tData } = await supabase.from('tickets').select('*');
        if (tData) setTickets(tData as any);

        // Fetch retention and lock status from settings table
        const { data: sData } = await supabase.from('settings').select('*');
        if (sData) {
            const retention = sData.find(s => s.key === 'house_retention');
            const locked = sData.find(s => s.key === 'guesses_locked');
            if (retention) setHouseRetention(retention.value);
            if (locked) setGuessesLocked(locked.value === true || locked.value === 'true');
        }
    };

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('dashboard-sync')
            .on('postgres_changes' as any, { event: '*', table: 'tickets' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const updateRetention = async (val: number) => {
        setHouseRetention(val);
        await supabase.from('settings').upsert({ key: 'house_retention', value: val });
    };

    const toggleGuessesLocked = async () => {
        const newVal = !guessesLocked;
        setGuessesLocked(newVal);
        await supabase.from('settings').upsert({ key: 'guesses_locked', value: newVal });
    };

    const handleReset = async () => {
        if (!confirm('ATENÇÃO: Isso resetará todo o progresso (placares, status e bilhetes), mas manterá os times e a tabela de jogos. Tem certeza?')) return;

        try {
            // 1. Reset all matches
            const { error: mError } = await supabase
                .from('matches')
                .update({
                    status: 'SCHEDULED',
                    score_a: 0,
                    score_b: 0,
                    winner_id: null
                })
                .neq('id', 'placeholder'); // Update all matching nothing = all

            if (mError) throw mError;

            // 2. Delete all tickets (cascades to bets)
            const { error: tError } = await supabase
                .from('tickets')
                .delete()
                .neq('id', 'placeholder'); // Delete all

            if (tError) throw tError;

            alert('Sistema resetado com sucesso! Próximo torneio pronto para palpites.');
            fetchData();
        } catch (err: any) {
            alert('Erro ao resetar: ' + err.message);
        }
    };

    const exportCSV = () => {
        const headers = ['ID', 'CPF', 'Status', 'Data', 'Picks'];
        const rows = tickets.map(t => [
            t.id,
            t.cpf,
            t.status,
            t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
            t.bets?.map(b => b.selectedTeamId).join('|') || 'N/A'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `copafly_tickets_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalArrecadado = tickets.length * 20;
    const valorCasa = (totalArrecadado * houseRetention) / 100;
    const poolPremio = totalArrecadado - valorCasa;

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block italic">Visão Geral</span>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">Dashboard</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={exportCSV} className="bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-3 text-xs font-black uppercase italic transition-all active:scale-95 shadow-lg">
                        <Download className="w-4 h-4 text-primary" /> Exportar CSV
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="glass-panel p-10 rounded-[3rem] border border-white/5 shadow-2xl group transition-all hover:border-primary/20 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500 opacity-20" />
                    </div>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 block">Total Arrecadado</span>
                    <div className="text-4xl font-black italic text-white tracking-tighter">R$ {totalArrecadado.toLocaleString()}</div>
                    <div className="mt-6 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary opacity-50" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">{tickets.length} Bilhetes Ativos</span>
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[3rem] border border-white/5 shadow-2xl bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex justify-between items-center mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                            <Percent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-primary italic">{houseRetention}%</span>
                            <input
                                type="range" min="0" max="100" value={houseRetention}
                                onChange={(e) => updateRetention(Number(e.target.value))}
                                className="w-16 h-1.5 accent-primary appearance-none bg-zinc-800 rounded-full cursor-pointer mt-2"
                            />
                        </div>
                    </div>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 block">Retenção da Casa</span>
                    <div className="text-4xl font-black italic text-zinc-500 tracking-tighter">R$ {valorCasa.toLocaleString()}</div>
                </div>

                <div className="bg-primary p-10 rounded-[3rem] shadow-[0_30px_90px_rgba(250,204,21,0.15)] relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="flex justify-between items-start mb-6 text-black/40">
                        <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center border border-black/5">
                            <Trophy className="w-6 h-6" />
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-black/40">Pool de Prêmio</span>
                    <div className="text-5xl font-black italic text-black tracking-tighter leading-none">R$ {poolPremio.toLocaleString()}</div>
                    <div className="mt-8 text-[10px] font-black text-black/30 uppercase tracking-widest italic leading-none flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 opacity-30" /> Dividido entre vencedores
                    </div>
                </div>

                <div className={cn(
                    "p-10 rounded-[3rem] border shadow-2xl transition-all relative overflow-hidden group cursor-pointer",
                    guessesLocked
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-green-500/10 border-green-500/20"
                )} onClick={toggleGuessesLocked}>
                    <div className="flex justify-between items-start mb-6">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border",
                            guessesLocked ? "bg-red-500/20 border-red-500/30" : "bg-green-500/20 border-green-500/30"
                        )}>
                            <ShieldCheck className={cn("w-6 h-6", guessesLocked ? "text-red-500" : "text-green-500")} />
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                            guessesLocked ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                        )}>
                            {guessesLocked ? 'BLOQUEADO' : 'ABERTO'}
                        </div>
                    </div>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-2 block">Novos Palpites</span>
                    <div className="text-3xl font-black italic text-white tracking-tighter">
                        {guessesLocked ? 'ENTRADAS FECHADAS' : 'RECEBENDO APOSTAS'}
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                        <RefreshCcw className={cn("w-4 h-4 opacity-50", !guessesLocked && "animate-spin-slow")} />
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">Toque para {guessesLocked ? 'abrir' : 'trancar'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 shadow-2xl bg-gradient-to-br from-white/[0.01] to-transparent">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 border-b border-white/5 pb-4">Top Atividades</h3>
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between py-4 border-b border-white/[0.03] last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                                        <TicketIcon className="w-5 h-5 text-primary/40" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-wider leading-none mb-1">Novo Bilhete Registrado</span>
                                        <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic">CPF ***.***.***-{i}0</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono text-white/10">Há {i * 2} min</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[3.5rem] border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <RefreshCcw className="w-12 h-12 text-red-500/20 mb-6 group-hover:rotate-180 transition-transform duration-1000" />
                    <h4 className="text-lg font-black uppercase italic tracking-tighter text-white/40 mb-2">Zona de Perigo</h4>
                    <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em] mb-8 max-w-[200px]">Cuidado: Esta ação resetará todo o progresso da copa atual.</p>
                    <button
                        onClick={handleReset}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black font-black uppercase text-[10px] px-8 py-4 rounded-full border border-red-500/20 transition-all active:scale-95 italic tracking-widest relative z-10"
                    >
                        Resetar Sistema
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .glass-panel {
                    background: rgba(10, 10, 10, 0.4);
                    backdrop-filter: blur(20px);
                }
            `}</style>
        </div>
    );
}
