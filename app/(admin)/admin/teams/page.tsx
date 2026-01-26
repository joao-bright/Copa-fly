'use client';

import { useState, useEffect, useRef } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, uploadTeamLogo } from '@/lib/data';
import { Team } from '@/lib/types';
import { Users, PlusCircle, Pencil, Trash2, Palette, Image as ImageIcon, ChevronRight, LayoutGrid, Search, X, Check, Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function AdminTeamsPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Partial<Team> | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        const data = await getTeams();
        setTeams(data);
    };

    useEffect(() => {
        setIsMounted(true);
        fetchData();

        const channel = supabase.channel('teams-sync')
            .on('postgres_changes' as any, { event: '*', table: 'teams' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadTeamLogo(file);
            setEditingTeam(prev => ({ ...prev, logoUrl: url }));
        } catch (err: any) {
            console.error('Upload error:', err);
            alert(`Erro ao fazer upload: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeam?.name) {
            alert('Nome da equipe é obrigatório');
            return;
        }

        setLoading(true);
        try {
            if (editingTeam.id) {
                await updateTeam(editingTeam.id, editingTeam);
            } else {
                await createTeam(editingTeam as { name: string, logoUrl?: string });
            }
            setIsModalOpen(false);
            setEditingTeam(null);
            fetchData();
        } catch (err) {
            alert('Erro ao salvar equipe');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;
        try {
            await deleteTeam(id);
            fetchData();
        } catch (err) {
            alert('Erro ao excluir equipe');
        }
    };

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!isMounted) return null;

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block italic">Gerenciamento</span>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">Equipes</h1>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar equipe..."
                            className="bg-zinc-900/50 border border-white/5 rounded-2xl px-12 py-4 text-xs font-bold uppercase italic text-white focus:border-primary/50 outline-none transition-all w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-white/20 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                        onClick={() => {
                            setEditingTeam({ name: '', logoUrl: '', group: '' });
                            setIsModalOpen(true);
                        }}
                        className="bg-primary hover:bg-white text-black px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase italic transition-all active:scale-95 shadow-lg shadow-primary/10"
                    >
                        <PlusCircle className="w-4 h-4" /> Nova Equipe
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                {filteredTeams.map(t => (
                    <div key={t.id} className="glass-panel rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="aspect-[1792/768] w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
                            {t.logoUrl ? (
                                <>
                                    <div className="absolute inset-0 opacity-20 blur-2xl bg-white/5" />
                                    <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-10" />
                                </>
                            ) : (
                                <div className="relative z-10 flex flex-col items-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <ImageIcon className="w-12 h-12 text-white" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white">SEM IMAGEM</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2 z-20">
                                <button
                                    onClick={() => {
                                        setEditingTeam(t);
                                        setIsModalOpen(true);
                                    }}
                                    className="w-10 h-10 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-primary border border-white/10 hover:bg-primary hover:text-black transition-all shadow-xl"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="w-10 h-10 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 border border-white/10 hover:bg-red-500 hover:text-black transition-all shadow-xl"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 aspect-[1792/768] rounded-xl flex items-center justify-center border-2 border-white/5 shadow-xl bg-zinc-900 overflow-hidden shrink-0">
                                        {t.logoUrl ? (
                                            <img src={t.logoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-black text-xs uppercase italic leading-none">{t.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">ID: {t.id.substring(0, 8)}...</span>
                                            {t.group && (
                                                <span className="text-[8px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full uppercase italic">Grupo {t.group}</span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{t.name}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="glass-panel w-full max-w-lg rounded-[3.5rem] border border-white/10 shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                    {editingTeam?.id ? 'Editar Equipe' : 'Nova Equipe'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-10">
                                {/* Image Upload Area */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Escudo / Banner</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative aspect-[1792/768] bg-zinc-950 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 transition-all group"
                                    >
                                        {uploading ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                                <span className="text-[10px] font-black text-primary uppercase">Enviando...</span>
                                            </div>
                                        ) : editingTeam?.logoUrl ? (
                                            <>
                                                <img src={editingTeam.logoUrl} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                                    <Camera className="w-8 h-8 text-white" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Alterar Imagem</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                                                    <Upload className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Upload de Imagem</p>
                                                    <p className="text-[9px] font-bold text-white/20">Recomendado: 1792 x 768px</p>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Nome da Equipe</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-8 py-5 text-lg font-black text-white focus:border-primary/50 outline-none transition-all uppercase italic font-sans"
                                            value={editingTeam?.name || ''}
                                            onChange={e => setEditingTeam(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="EX: POZE E ORUAM"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Grupo</label>
                                        <select
                                            className="w-full h-[68px] bg-zinc-950 border border-white/5 rounded-2xl px-8 text-lg font-black text-white focus:border-primary/50 outline-none transition-all uppercase italic font-sans appearance-none"
                                            value={editingTeam?.group || ''}
                                            onChange={e => setEditingTeam(prev => ({ ...prev, group: e.target.value }))}
                                        >
                                            <option value="">Nenhum</option>
                                            <option value="A">Grupo A</option>
                                            <option value="B">Grupo B</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="w-full bg-primary text-black font-black italic uppercase py-6 rounded-[2rem] shadow-2xl shadow-primary/20 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 text-lg"
                                >
                                    {loading ? 'Processando...' : editingTeam?.id ? 'ATUALIZAR EQUIPE' : 'CADASTRAR EQUIPE'}
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
            `}</style>
        </div>
    );
}
