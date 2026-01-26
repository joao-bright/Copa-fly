'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Ticket as TicketType } from '@/lib/types';
import { Ticket as TicketIcon, Search, User, Clock, ShieldCheck, CheckCircle2, ChevronRight, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminTicketsPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                const mapped = (data as any[]).map(t => ({
                    ...t,
                    createdAt: t.created_at
                }));
                setTickets(mapped);
            }
        };
        fetchData();

        const channel = supabase.channel('tickets-realtime')
            .on('postgres_changes' as any, { event: '*', table: 'tickets' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const filteredTickets = tickets.filter(t =>
        t.cpf.includes(searchQuery) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isMounted) return null;

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block italic">Gerenciamento</span>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">Clientes</h1>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por CPF ou ID..."
                            className="bg-zinc-900/50 border border-white/5 rounded-2xl px-12 py-4 text-xs font-bold uppercase italic text-white focus:border-primary/50 outline-none transition-all w-72"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-white/20 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button className="bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase italic transition-all active:scale-95">
                        <Filter className="w-4 h-4 text-primary" /> Filtros
                    </button>
                </div>
            </header>

            <div className="glass-panel rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden bg-gradient-to-br from-white/[0.01] to-transparent">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Nome / Identificação</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Status</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Palpites</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Data Registro</th>
                                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <TicketIcon className="w-12 h-12" />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Nenhum bilhete encontrado</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((t) => (
                                    <tr key={t.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl group-hover:border-primary/20 transition-all">
                                                    <User className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-white italic tracking-tight">{(t as any).customer_name || 'Usuário Fly'}</span>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{t.cpf}</span>
                                                    <span className="text-[8px] font-black text-primary/20 uppercase tracking-widest italic">{t.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 w-fit">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest italic leading-none">{t.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-1 flex-1 bg-zinc-900 rounded-full overflow-hidden min-w-[100px]">
                                                        <div className="h-full bg-primary" style={{ width: '0%' }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-white/20 italic">0/15</span>
                                                </div>
                                                <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Aguardando Resultados</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-3.5 h-3.5 text-white/10" />
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => router.push(`/tickets/${t.id}`)}
                                                    className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-primary transition-colors group/btn"
                                                >
                                                    Ver Bilhete <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
