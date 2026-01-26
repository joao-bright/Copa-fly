'use client';

import { getMatches, getTeams, createMatch } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { Match, Team, MatchStatus } from '@/lib/types';
import { Sword, Settings, Save, Trophy, RefreshCcw, PlayCircle, PlusCircle, CheckCircle2, ChevronRight, LayoutGrid, X, Clock, Calendar, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function AdminMatchesPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMatch, setNewMatch] = useState({
        phase: 'GROUP',
        round: 1,
        group: 'A',
        teamAId: '',
        teamBId: '',
        startTime: '13:00'
    });
    const [matchHour, setMatchHour] = useState('13');
    const [matchMinute, setMatchMinute] = useState('00');
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

    // Filters
    const [filterGroup, setFilterGroup] = useState('ALL');
    const [filterRound, setFilterRound] = useState('ALL');

    useEffect(() => {
        setNewMatch(prev => ({ ...prev, startTime: `${matchHour}:${matchMinute}` }));
    }, [matchHour, matchMinute]);

    const fetchData = async () => {
        const mData = await getMatches();
        setMatches(mData);
        const tData = await getTeams();
        setTeams(tData);
    };

    useEffect(() => {
        setIsMounted(true);
        fetchData();

        // Setup real-time subscription
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes' as any, { event: '*', table: 'matches' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleCreateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMatch.teamAId || !newMatch.teamBId) {
            alert('Selecione ambos os times!');
            return;
        }
        if (newMatch.teamAId === newMatch.teamBId) {
            alert('Os times devem ser diferentes!');
            return;
        }

        try {
            if (editingMatchId) {
                // Update existing match
                const { error } = await supabase
                    .from('matches')
                    .update({
                        phase: newMatch.phase,
                        round: newMatch.round,
                        team_group: newMatch.group,
                        team_a_id: newMatch.teamAId,
                        team_b_id: newMatch.teamBId,
                        start_time: newMatch.startTime
                    })
                    .eq('id', editingMatchId);

                if (error) throw error;
            } else {
                await createMatch(newMatch);
            }

            setIsModalOpen(false);
            setEditingMatchId(null);
            setNewMatch({
                phase: 'GROUP',
                round: 1,
                group: 'A',
                teamAId: '',
                teamBId: '',
                startTime: '13:00'
            });
            fetchData();
        } catch (err: any) {
            alert('Erro ao salvar partida: ' + err.message);
        }
    };

    const handleDeleteMatch = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta partida?')) return;

        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('id', id);

        if (error) alert('Erro ao excluir: ' + error.message);
        else fetchData();
    };

    const openEditModal = (m: Match) => {
        setEditingMatchId(m.id);
        const [h, min] = (m.startTime || '13:00').split(':');
        setMatchHour(h || '13');
        setMatchMinute(min || '00');
        setNewMatch({
            phase: m.phase,
            round: m.round || 1,
            group: m.group || 'A',
            teamAId: m.teamA?.id || '',
            teamBId: m.teamB?.id || '',
            startTime: m.startTime || '13:00'
        });
        setIsModalOpen(true);
    };

    const setMatchStatus = async (matchId: string, status: MatchStatus, winnerId?: string | null) => {
        const updateData: any = { status };
        if (winnerId !== undefined) updateData.winner_id = winnerId;

        const { error } = await supabase
            .from('matches')
            .update(updateData)
            .eq('id', matchId);

        if (error) alert('Erro ao atualizar status: ' + error.message);
        fetchData();
    };

    const updateScore = async (matchId: string, scoreA: number, scoreB: number) => {
        const finalScoreA = Math.max(0, scoreA);
        const finalScoreB = Math.max(0, scoreB);

        const { error } = await supabase
            .from('matches')
            .update({ score_a: finalScoreA, score_b: finalScoreB })
            .eq('id', matchId);

        if (error) alert('Erro ao salvar placar: ' + error.message);
        fetchData();
    };

    const generateSemis = async () => {
        const groupMatches = matches.filter(m => m.phase === 'GROUP');
        if (groupMatches.length === 0) {
            alert('Não há jogos de grupo registrados!');
            return;
        }
        if (groupMatches.some(m => m.status !== 'FINISHED')) {
            alert('Finalize todos os jogos da fase de grupos primeiro!');
            return;
        }

        const calculateStandings = (group: string) => {
            const groupTeams = teams.filter(t => t.group === group);
            const standings = groupTeams.map(team => {
                let points = 0;
                let goalsFor = 0;
                let goalsAgainst = 0;

                const teamMatches = groupMatches.filter(m =>
                    (m.teamA?.id === team.id || m.teamB?.id === team.id) && m.group === group
                );

                teamMatches.forEach(m => {
                    const isTeamA = m.teamA?.id === team.id;
                    const teamScore = isTeamA ? (m.scoreA || 0) : (m.scoreB || 0);
                    const opponentScore = isTeamA ? (m.scoreB || 0) : (m.scoreA || 0);

                    goalsFor += teamScore;
                    goalsAgainst += opponentScore;

                    if (m.winnerId === team.id) {
                        points += 3;
                    } else if (!m.winnerId && m.status === 'FINISHED') {
                        points += 1;
                    }
                });

                return { ...team, points, gd: goalsFor - goalsAgainst, gf: goalsFor };
            });

            return standings.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });
        };

        const standingsA = calculateStandings('A');
        const standingsB = calculateStandings('B');

        if (standingsA.length < 2 || standingsB.length < 2) {
            alert('Grupos incompletos!');
            return;
        }

        const semi1 = {
            phase: 'SEMI',
            status: 'SCHEDULED',
            start_time: '14:00',
            team_a_id: standingsA[0].id,
            team_b_id: standingsB[1].id
        };
        const semi2 = {
            phase: 'SEMI',
            status: 'SCHEDULED',
            start_time: '15:00',
            team_a_id: standingsB[0].id,
            team_b_id: standingsA[1].id
        };

        const { error } = await supabase.from('matches').insert([semi1, semi2]);
        if (error) alert('Erro ao gerar semis: ' + error.message);
        else alert('Semifinais geradas!');
        fetchData();
    };

    const generateFinal = async () => {
        const semis = matches.filter(m => m.phase === 'SEMI');
        if (semis.length < 2) {
            alert('Gere as semifinais primeiro!');
            return;
        }
        if (semis.some(m => m.status !== 'FINISHED')) {
            alert('Finalize as semis primeiro!');
            return;
        }

        const finalMatch = {
            phase: 'FINAL',
            status: 'SCHEDULED',
            start_time: '17:00',
            team_a_id: semis[0].winnerId,
            team_b_id: semis[1].winnerId,
        };
        const { error } = await supabase.from('matches').insert([finalMatch]);
        if (error) alert('Erro ao gerar final: ' + error.message);
        else alert('Final gerada!');
        fetchData();
    };

    if (!isMounted) return null;

    const filteredMatches = matches.filter(m => {
        if (filterGroup !== 'ALL' && m.group !== filterGroup) return false;
        if (filterRound !== 'ALL' && m.round?.toString() !== filterRound) return false;
        return true;
    });

    const groupedMatches = filteredMatches.reduce((acc: any, m) => {
        const key = m.phase === 'GROUP' ? `GRUPO ${m.group} - RODADA ${m.round}` : m.phase;
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    const sortedKeys = Object.keys(groupedMatches).sort((a, b) => {
        if (a.includes('GRUPO A') && b.includes('GRUPO B')) return -1;
        if (a.includes('GRUPO B') && b.includes('GRUPO A')) return 1;
        if (a.includes('GRUPO') && !b.includes('GRUPO')) return -1;
        if (!a.includes('GRUPO') && b.includes('GRUPO')) return 1;
        if (a === 'SEMI' && b === 'FINAL') return -1;
        if (a === 'FINAL' && b === 'SEMI') return 1;
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div className="flex flex-col gap-6">
                    <div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block italic">Gerenciamento</span>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">Partidas</h1>
                    </div>

                    {/* Filters Row */}
                    <div className="flex gap-4 p-1.5 bg-zinc-950/50 border border-white/5 rounded-2xl w-fit backdrop-blur-md">
                        <div className="relative flex items-center border-r border-white/5 pr-2">
                            <div className="flex items-center gap-2 px-4 py-2 pointer-events-none">
                                <LayoutGrid className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-[9px] font-black uppercase italic text-white/40 tracking-widest">Grupo:</span>
                            </div>
                            <div className="relative flex items-center">
                                <select
                                    className="bg-transparent text-[9px] font-black uppercase italic text-white/90 outline-none appearance-none pr-8 py-2 cursor-pointer hover:text-primary transition-colors"
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                >
                                    <option value="ALL">Todos</option>
                                    <option value="A">Grupo A</option>
                                    <option value="B">Grupo B</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-white/20 absolute right-2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="relative flex items-center">
                            <div className="flex items-center gap-2 px-4 py-2 pointer-events-none">
                                <Calendar className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-[9px] font-black uppercase italic text-white/40 tracking-widest">Rodada:</span>
                            </div>
                            <div className="relative flex items-center">
                                <select
                                    className="bg-transparent text-[9px] font-black uppercase italic text-white/90 outline-none appearance-none pr-8 py-2 cursor-pointer hover:text-primary transition-colors"
                                    value={filterRound}
                                    onChange={(e) => setFilterRound(e.target.value)}
                                >
                                    <option value="ALL">Todas</option>
                                    <option value="1">1ª</option>
                                    <option value="2">2ª</option>
                                    <option value="3">3ª</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-white/20 absolute right-2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary hover:bg-white text-black px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase italic transition-all active:scale-95 shadow-lg shadow-primary/10"
                    >
                        <PlusCircle className="w-4 h-4" /> Nova Partida
                    </button>
                    <button onClick={generateSemis} className="bg-zinc-900 hover:bg-zinc-800 text-primary border border-primary/20 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase italic transition-all active:scale-95 text-nowrap">
                        <RefreshCcw className="w-4 h-4" /> Gerar Semifinais
                    </button>
                    <button onClick={generateFinal} className="bg-zinc-900 hover:bg-zinc-800 text-primary border border-primary/20 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase italic transition-all active:scale-95 text-nowrap">
                        <Trophy className="w-4 h-4" /> Gerar Final
                    </button>
                </div>
            </header>

            <div className="space-y-16">
                {sortedKeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                        <Sword className="w-12 h-12 text-white/5 mb-6" />
                        <span className="text-white/20 font-black uppercase italic tracking-widest text-sm">Nenhuma partida registrada</span>
                    </div>
                ) : (
                    sortedKeys.map(key => (
                        <section key={key} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter flex-shrink-0">{key}</h2>
                                <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1" />
                            </div>

                            <div className="flex flex-col gap-4">
                                {groupedMatches[key].map((m: Match) => (
                                    <div key={m.id} className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl relative group transition-all hover:border-white/10 overflow-hidden bg-gradient-to-r from-white/[0.02] to-transparent">
                                        <div className="flex items-center gap-12">
                                            {/* Info Col */}
                                            <div className="w-48 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    {m.status === 'LIVE' && (
                                                        <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/10">
                                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                            <span className="text-[7px] font-black text-red-500 uppercase tracking-widest italic">AO VIVO</span>
                                                        </div>
                                                    )}
                                                    {m.status === 'FINISHED' && (
                                                        <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/10">
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                            <span className="text-[7px] font-black text-green-500 uppercase tracking-widest italic">FIM</span>
                                                        </div>
                                                    )}
                                                    {m.status === 'SCHEDULED' && (
                                                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                                            <Clock className="w-3 h-3 text-white/20" />
                                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest italic">{m.startTime}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[8px] font-mono text-white/10 uppercase tracking-wider truncate">{m.id}</span>
                                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(m)}
                                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMatch(m.id)}
                                                        className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-500/40 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Teams Row */}
                                            <div className="flex-1 flex items-center justify-between gap-12">
                                                {/* Team A */}
                                                <div className="flex-1 flex items-center justify-end gap-6 group/team">
                                                    <span className="text-sm font-black uppercase tracking-tight text-white/60 text-right">{m.teamA?.name}</span>
                                                    <div className={cn(
                                                        "w-28 aspect-[1792/768] rounded-lg flex items-center justify-center border transition-all duration-300 relative overflow-hidden bg-zinc-950",
                                                        m.winnerId === m.teamA?.id ? 'border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border-white/5',
                                                        m.status === 'FINISHED' && m.winnerId !== m.teamA?.id && 'opacity-20 grayscale'
                                                    )}>
                                                        {m.teamA?.logoUrl && <img src={m.teamA.logoUrl} className="w-full h-full object-cover" />}
                                                    </div>
                                                    {m.status === 'LIVE' && (
                                                        <button
                                                            onClick={() => setMatchStatus(m.id, 'FINISHED', m.teamA!.id)}
                                                            className="bg-green-500 hover:bg-white text-black p-2 rounded-lg transition-all active:scale-95 opacity-0 group-hover/team:opacity-100 shadow-lg shadow-green-500/20"
                                                        >
                                                            <Trophy className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Scores & Controls */}
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="flex items-center gap-4 px-6 py-3 bg-zinc-950/80 rounded-2xl border border-white/5 shadow-inner min-w-[140px] justify-center">
                                                        <span className={cn("font-black text-3xl font-sans", m.status === 'FINISHED' && m.winnerId !== m.teamA?.id ? 'text-white/20' : 'text-white')}>{m.scoreA || 0}</span>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", m.status === 'LIVE' ? 'bg-primary animate-pulse' : 'bg-white/5')} />
                                                        <span className={cn("font-black text-3xl font-sans", m.status === 'FINISHED' && m.winnerId !== m.teamB?.id ? 'text-white/20' : 'text-white')}>{m.scoreB || 0}</span>
                                                    </div>

                                                    {m.status === 'LIVE' && (
                                                        <div className="flex gap-16 -mt-1">
                                                            <div className="flex gap-2">
                                                                <button onClick={() => updateScore(m.id, (m.scoreA || 0) + 1, m.scoreB || 0)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-primary text-xs">+</button>
                                                                <button onClick={() => updateScore(m.id, (m.scoreA || 0) - 1, m.scoreB || 0)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-white/20 text-xs">-</button>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => updateScore(m.id, m.scoreA || 0, (m.scoreB || 0) + 1)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-primary text-xs">+</button>
                                                                <button onClick={() => updateScore(m.id, m.scoreA || 0, (m.scoreB || 0) - 1)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center text-white/20 text-xs">-</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Team B */}
                                                <div className="flex-1 flex items-center justify-start gap-6 group/team">
                                                    {m.status === 'LIVE' && (
                                                        <button
                                                            onClick={() => setMatchStatus(m.id, 'FINISHED', m.teamB!.id)}
                                                            className="bg-green-500 hover:bg-white text-black p-2 rounded-lg transition-all active:scale-95 opacity-0 group-hover/team:opacity-100 shadow-lg shadow-green-500/20"
                                                        >
                                                            <Trophy className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <div className={cn(
                                                        "w-28 aspect-[1792/768] rounded-lg flex items-center justify-center border transition-all duration-300 relative overflow-hidden bg-zinc-950",
                                                        m.winnerId === m.teamB?.id ? 'border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border-white/5',
                                                        m.status === 'FINISHED' && m.winnerId !== m.teamB?.id && 'opacity-20 grayscale'
                                                    )}>
                                                        {m.teamB?.logoUrl && <img src={m.teamB.logoUrl} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="text-sm font-black uppercase tracking-tight text-white/60">{m.teamB?.name}</span>
                                                </div>
                                            </div>

                                            {/* Actions Col */}
                                            <div className="w-48 flex justify-end">
                                                {m.status === 'SCHEDULED' && (
                                                    <button
                                                        onClick={() => setMatchStatus(m.id, 'LIVE')}
                                                        className="bg-primary hover:bg-white text-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 text-[9px] font-black italic tracking-widest active:scale-95 flex items-center gap-2"
                                                    >
                                                        <PlayCircle className="w-4 h-4" /> INICIAR
                                                    </button>
                                                )}
                                                {m.status === 'LIVE' && (
                                                    <span className="text-[8px] font-black text-white/10 italic tracking-tighter uppercase mr-4">Selecione o vencedor</span>
                                                )}
                                                {m.status === 'FINISHED' && (
                                                    <button
                                                        onClick={() => setMatchStatus(m.id, 'SCHEDULED', null)}
                                                        className="text-white/10 hover:text-white transition-colors"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {/* New Match Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="glass-panel w-full max-w-2xl rounded-[3.5rem] border border-white/10 shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                    {editingMatchId ? 'Editar Partida' : 'Nova Partida'}
                                </h2>
                                <button onClick={() => { setIsModalOpen(false); setEditingMatchId(null); }} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateMatch} className="space-y-8">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 italic">Fase</label>
                                        <div className="relative group/select">
                                            <select
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-primary/50 appearance-none uppercase italic cursor-pointer transition-all group-hover/select:border-white/10"
                                                value={newMatch.phase}
                                                onChange={e => setNewMatch({ ...newMatch, phase: e.target.value })}
                                            >
                                                <option value="GROUP">Grupo</option>
                                                <option value="SEMI">Semi</option>
                                                <option value="FINAL">Final</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-white/20 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-focus-within/select:text-primary group-hover/select:text-white/40" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 italic">Rodada</label>
                                        <div className="relative group/select">
                                            <select
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-primary/50 appearance-none uppercase italic cursor-pointer transition-all group-hover/select:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={newMatch.round}
                                                onChange={e => setNewMatch({ ...newMatch, round: parseInt(e.target.value) })}
                                                disabled={newMatch.phase !== 'GROUP'}
                                            >
                                                <option value={1}>1ª Rodada</option>
                                                <option value={2}>2ª Rodada</option>
                                                <option value={3}>3ª Rodada</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-white/20 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-focus-within/select:text-primary group-hover/select:text-white/40" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 italic">Grupo</label>
                                        <div className="relative group/select">
                                            <select
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-xs font-black text-white outline-none focus:border-primary/50 appearance-none uppercase italic cursor-pointer transition-all group-hover/select:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={newMatch.group}
                                                onChange={e => setNewMatch({ ...newMatch, group: e.target.value })}
                                                disabled={newMatch.phase !== 'GROUP'}
                                            >
                                                <option value="A">Grupo A</option>
                                                <option value="B">Grupo B</option>
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-white/20 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-focus-within/select:text-primary group-hover/select:text-white/40" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 italic">Time A</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {teams
                                                .filter(t => !newMatch.group || t.group === newMatch.group || newMatch.phase !== 'GROUP')
                                                .map(t => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setNewMatch({ ...newMatch, teamAId: t.id })}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                            newMatch.teamAId === t.id ? "bg-primary border-primary text-black" : "bg-zinc-900 border-white/5 text-white/40 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className="w-10 aspect-[1792/768] bg-black rounded overflow-hidden">
                                                            {t.logoUrl && <img src={t.logoUrl} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase italic tracking-tighter">{t.name}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 italic">Time B</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {teams
                                                .filter(t => !newMatch.group || t.group === newMatch.group || newMatch.phase !== 'GROUP')
                                                .map(t => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setNewMatch({ ...newMatch, teamBId: t.id })}
                                                        className={cn(
                                                            "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                            newMatch.teamBId === t.id ? "bg-primary border-primary text-black" : "bg-zinc-900 border-white/5 text-white/40 hover:border-white/20"
                                                        )}
                                                    >
                                                        <div className="w-10 aspect-[1792/768] bg-black rounded overflow-hidden">
                                                            {t.logoUrl && <img src={t.logoUrl} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase italic tracking-tighter">{t.name}</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-4 italic">Horário de Início</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 relative group/select">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest italic">HORA</span>
                                            </div>
                                            <select
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl pl-20 pr-12 py-5 text-lg font-black text-white focus:border-primary/50 outline-none transition-all appearance-none italic font-sans cursor-pointer group-hover/select:border-white/10"
                                                value={matchHour}
                                                onChange={e => setMatchHour(e.target.value)}
                                            >
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-5 h-5 text-white/20 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-focus-within/select:text-primary group-hover/select:text-white/40" />
                                        </div>
                                        <div className="text-2xl font-black text-white/10">:</div>
                                        <div className="flex-1 relative group/select">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <span className="text-[8px] font-black uppercase text-white/20 tracking-widest italic">MIN</span>
                                            </div>
                                            <select
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl pl-16 pr-12 py-5 text-lg font-black text-white focus:border-primary/50 outline-none transition-all appearance-none italic font-sans cursor-pointer group-hover/select:border-white/10"
                                                value={matchMinute}
                                                onChange={e => setMatchMinute(e.target.value)}
                                            >
                                                {['00', '15', '30', '45'].map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-5 h-5 text-white/20 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-focus-within/select:text-primary group-hover/select:text-white/40" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-black font-black italic uppercase py-6 rounded-[2rem] shadow-2xl shadow-primary/20 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-4 text-lg"
                                >
                                    {editingMatchId ? 'SALVAR ALTERAÇÕES' : 'CRIAR PARTIDA'} <Sword className="w-6 h-6" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .glass-panel {
                    background: rgba(10, 10, 10, 0.4);
                    backdrop-filter: blur(20px);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(250, 204, 21, 0.2);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
