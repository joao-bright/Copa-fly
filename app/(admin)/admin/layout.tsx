'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { ShieldCheck, Key, ArrowRight } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        const isAuth = sessionStorage.getItem('fly_admin_auth');
        if (isAuth === 'true') setAuthorized(true);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPassword === 'admin123') {
            setAuthorized(true);
            sessionStorage.setItem('fly_admin_auth', 'true');
        } else {
            setAuthError('Senha incorreta!');
        }
    };

    if (!isMounted) return null;

    if (!authorized) {
        return (
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.03),transparent_70%)]" />
                <div className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/10 relative z-10 animate-in fade-in zoom-in-95 shadow-3xl text-center">
                    <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto mb-8 rotate-3 shadow-2xl">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">ADMIN <span className="text-primary">FLY CUP</span></h1>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mb-10 italic">Gerenciamento de Elite</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">
                                <Key className="w-3.5 h-3.5 text-primary" /> Senha Mestra
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-5 text-white text-center focus:border-primary/50 outline-none transition-all font-mono"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                            />
                        </div>

                        {authError && <p className="text-red-500 text-[10px] font-black uppercase italic animate-pulse">{authError}</p>}

                        <button type="submit" className="w-full bg-primary text-black font-black uppercase py-5 rounded-[1.5rem] shadow-xl shadow-primary/10 italic tracking-widest text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            ACESSAR PAINEL <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <div className="h-screen bg-[#050505] flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-72 p-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
