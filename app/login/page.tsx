'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key, ShieldCheck, LogIn, Trophy } from 'lucide-react';
import { cn, formatCPF, validateCPF } from '@/lib/utils';

export default function LoginPage() {
    const router = useRouter();
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateCPF(cpf)) return setError('CPF inválido.');
        if (!password) return setError('Senha obrigatória.');

        try {
            const { data, error: dbError } = await supabase
                .from('tickets')
                .select('*')
                .eq('cpf', cpf)
                .maybeSingle();

            if (dbError) throw dbError;

            if (!data) {
                return setError('CPF não encontrado. Crie um bilhete primeiro!');
            }

            // Simple password check (assuming stored in 'password' column)
            if (data.password && data.password !== password) {
                return setError('Senha incorreta.');
            }

            localStorage.setItem('copa_user_cpf', cpf);
            localStorage.setItem('copa_user_name', (data as any).customer_name || 'Usuário Fly');
            localStorage.setItem('copa_user_email', (data as any).customer_email || '');

            router.push('/tickets');
        } catch (err: any) {
            setError('Erro ao fazer login: ' + err.message);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/10 relative z-10 animate-in fade-in zoom-in-95 shadow-3xl">
                <button onClick={() => router.push('/')} className="absolute top-8 left-8 text-white/20 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl">
                        <Trophy className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">FAZER LOGIN</h1>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mt-3 italic">Acesse sua conta Fly Cup</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Seu CPF
                        </div>
                        <input
                            type="text"
                            placeholder="000.000.000-00"
                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-5 text-white font-mono text-center tracking-[0.2em] focus:border-primary/50 outline-none transition-all"
                            value={cpf}
                            onChange={(e) => setCpf(formatCPF(e.target.value))}
                            maxLength={14}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">
                            <Key className="w-3.5 h-3.5 text-primary" /> Sua Senha
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-5 text-white text-center focus:border-primary/50 outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-[10px] text-center font-black uppercase animate-pulse tracking-wide">{error}</p>}

                    <button type="submit" className="w-full bg-primary text-black font-black uppercase py-5 rounded-[1.5rem] shadow-xl shadow-primary/10 italic tracking-widest text-lg hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
                        ENTRAR <LogIn className="w-5 h-5" />
                    </button>

                    <div className="pt-6 border-t border-white/5 text-center">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                            Não tem palpites ainda?
                        </p>
                        <button onClick={() => router.push('/')} className="mt-2 text-[11px] font-black text-primary uppercase underline italic">
                            CRIAR NOVO BILHETE
                        </button>
                    </div>

                    <div className="pt-2 text-center">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                            Novo por aqui?
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="mt-3 w-full bg-white/5 border border-white/5 py-4 rounded-xl text-[10px] font-black text-white uppercase italic hover:bg-white/10 transition-all"
                        >
                            CADASTRAR / CRIAR CONTA
                        </button>
                    </div>
                </form>
            </div>

            <p className="fixed bottom-10 text-[8px] font-black text-white/5 uppercase tracking-[0.5em]">
                Copa Fly © 2026 - Sua sorte começa aqui
            </p>
        </main>
    );
}
