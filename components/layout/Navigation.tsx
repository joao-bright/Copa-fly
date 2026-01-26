'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Ticket, Home, BarChart3, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check local storage for login status
        const checkAuth = () => {
            const cpf = localStorage.getItem('copa_user_cpf');
            setIsLoggedIn(!!cpf);
        };

        checkAuth();
        // Listener for changes in local storage (in case login happens in another tab or component)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    if (!isMounted) return null;

    // Hide navigation in admin, login and home views (to avoid overlap with floating buttons)
    if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/') return null;

    const navItems = [
        { label: 'INÍCIO', href: '/', icon: Home },
        { label: 'AO VIVO', href: '/live', icon: Radio },
        { label: 'BILHETES', href: '/tickets', icon: Ticket },
        { label: 'RANKING', href: '/ranking', icon: Trophy },
    ];

    return (
        <div className="fixed bottom-8 left-0 w-full z-[200] px-4 pointer-events-none">
            <nav className="max-w-md mx-auto bg-zinc-950/90 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1.5 transition-all flex-1 py-3 px-2 rounded-[2rem]",
                                isActive ? "bg-primary/10 text-primary" : "text-white/20 hover:text-white/40"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                isActive ? "bg-primary/20 border border-primary/30" : "bg-white/5"
                            )}>
                                <item.icon className={cn("w-5 h-5", isActive ? "fill-primary/20 text-primary" : "text-white/40")} />
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest italic">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}
