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
        { label: 'Início', href: '/', icon: Home },
        { label: 'Ao Vivo', href: '/live', icon: Radio },
        { label: 'Bilhetes', href: '/tickets', icon: Ticket },
        { label: 'Ranking', href: '/ranking', icon: BarChart3 },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-around items-center">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all flex-1 py-1",
                            isActive ? "text-primary scale-110" : "text-white/20 hover:text-white/40"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5", isActive ? "fill-primary/20" : "")} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                        {isActive && <div className="w-1 h-1 bg-primary rounded-full mt-0.5 animate-pulse" />}
                    </Link>
                )
            })}
        </nav>
    );
}
