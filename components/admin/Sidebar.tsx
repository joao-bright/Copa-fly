'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Sword, Users, Ticket, Settings, LogOut, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Partidas', href: '/admin/matches', icon: Sword },
    { label: 'Equipes', href: '/admin/teams', icon: Users },
    { label: 'Clientes', href: '/admin/tickets', icon: Ticket },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        sessionStorage.removeItem('fly_admin_auth');
        window.location.href = '/admin';
    };

    return (
        <aside className="w-72 h-screen bg-[#060606] border-r border-white/5 flex flex-col fixed left-0 top-0 z-[60]">
            <div className="p-8 pb-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                        <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1 italic">Admin</span>
                        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Copa Fly</h1>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-5 py-4 rounded-2xl transition-all group",
                                isActive
                                    ? "bg-primary text-black shadow-[0_10px_30px_rgba(250,204,21,0.2)]"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={cn("w-5 h-5", isActive ? "text-black" : "text-primary/40 group-hover:text-primary transition-colors")} />
                                <span className="font-black italic uppercase tracking-widest text-[11px]">{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="font-black italic uppercase tracking-widest text-[11px]">Sair do Painel</span>
                </button>
            </div>
        </aside>
    );
}
