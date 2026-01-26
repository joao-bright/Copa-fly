'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMatches, saveTicket, getTeams } from '@/lib/data';
import GameCard from '@/components/betting/GameCard';
import SimulatorStandings from '@/components/betting/SimulatorStandings';
import BracketVisual from '@/components/betting/BracketVisual';
import { Match, Team } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { ArrowRight, ArrowLeft, Trophy, CheckCircle2, LogIn, LogOut, LayoutDashboard, ChevronLeft, ChevronRight, Sparkles, X, Star, ShieldCheck, Copy, Check, PlusCircle, Ticket as TicketIcon, User, Mail, Lock, Calendar, Zap, Calculator, Radio, Play } from 'lucide-react';
import { cn, formatCPF, validateCPF } from '@/lib/utils';

type FlowStep = 'GROUP_1' | 'GROUP_2' | 'GROUP_3' | 'SEMIS' | 'FINAL' | 'UPSELL' | 'REGISTER' | 'SUMMARY' | 'PAYMENT' | 'SUCCESS';

export default function Home() {
  const router = useRouter();

  // --- AUTH CHECK ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCpf, setUserCpf] = useState('');

  useEffect(() => {
    const cpf = localStorage.getItem('copa_user_cpf');
    if (cpf) {
      setIsLoggedIn(true);
      setUserCpf(cpf);
    }
  }, []);

  // --- STATE ---
  const [step, setStep] = useState<FlowStep>('GROUP_1');
  const [ticketsToBuy, setTicketsToBuy] = useState(1);
  const [activeTicketIdx, setActiveTicketIdx] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>[]>([{}, {}, {}]);
  const [regData, setRegData] = useState({ name: '', cpf: '', email: '', password: '' });
  const [regError, setRegError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{ pix_qr_code: string, pix_copy_paste: string, order_id: string } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Dual Mode State
  const [showSimulator, setShowSimulator] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [guessesLocked, setGuessesLocked] = useState(false);
  const [userGuesses, setUserGuesses] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (step === 'PAYMENT' || step === 'SUCCESS' || step === 'REGISTER') {
      document.body.classList.add('hide-nav');
    } else {
      document.body.classList.remove('hide-nav');
    }
    return () => document.body.classList.remove('hide-nav');
  }, [step]);

  useEffect(() => {
    const fetchData = async () => {
      const [mRes, tRes, sRes] = await Promise.all([
        getMatches(),
        getTeams(),
        supabase.from('settings').select('*')
      ]);
      setMatches(mRes);
      setTeams(tRes);

      if (sRes.data) {
        const locked = (sRes.data as any[]).find(s => s.key === 'guesses_locked');
        const isLocked = locked?.value === true || locked?.value === 'true';
        setGuessesLocked(isLocked);

        if (isLocked) {
          const cpf = localStorage.getItem('copa_user_cpf');
          if (cpf) {
            const { data: tickets } = await supabase
              .from('tickets')
              .select('id, bets(*)')
              .eq('cpf', cpf)
              .eq('status', 'ACTIVE')
              .order('created_at', { ascending: false })
              .limit(1);

            if (tickets && tickets[0]) {
              const picks: Record<string, string> = {};
              tickets[0].bets.forEach((b: any) => {
                picks[b.match_id] = b.selected_team_id;
              });
              setUserGuesses(picks);
            }
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [isLoggedIn]); // Added isLoggedIn to dependency array to refetch if user logs in/out

  const groupMatches = useMemo(() => matches.filter(m => m.phase === 'GROUP'), [matches]);
  const round1Matches = useMemo(() => matches.filter(m => m.phase === 'GROUP' && m.round === 1), [matches]);
  const round2Matches = useMemo(() => matches.filter(m => m.phase === 'GROUP' && m.round === 2), [matches]);
  const round3Matches = useMemo(() => matches.filter(m => m.phase === 'GROUP' && m.round === 3), [matches]);

  const calculateStandings = (group: string, ticketIdx: number) => {
    const groupTeams = teams.filter(t => t.group === group);
    const sel = selections[ticketIdx];

    const standings = groupTeams.map(team => {
      let points = 0;
      let wins = 0;
      const teamMatches = groupMatches.filter(m =>
        m.group === group && (m.teamA?.id === team.id || m.teamB?.id === team.id)
      );
      teamMatches.forEach(m => {
        if (sel[m.id] === team.id) {
          points += 3;
          wins += 1;
        }
      });
      return { ...team, points, wins };
    });

    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });
  };

  const getBracketTeams = (ticketIdx: number) => {
    const standingsA = calculateStandings('A', ticketIdx);
    const standingsB = calculateStandings('B', ticketIdx);

    return {
      a1: standingsA[0] || null,
      a2: standingsA[1] || null,
      b1: standingsB[0] || null,
      b2: standingsB[1] || null
    };
  };

  const currentMatches = useMemo(() => {
    if (step === 'GROUP_1') return round1Matches;
    if (step === 'GROUP_2') return round2Matches;
    if (step === 'GROUP_3') return round3Matches;
    return [];
  }, [step, round1Matches, round2Matches, round3Matches]);

  const semiMatches = useMemo(() => {
    const bracket = getBracketTeams(activeTicketIdx);
    return [
      { id: 'derived_s1', phase: 'SEMI', teamA: bracket.a1, teamB: bracket.b2, startTime: '14:00', winnerId: null, status: 'SCHEDULED' },
      { id: 'derived_s2', phase: 'SEMI', teamA: bracket.b1, teamB: bracket.a2, startTime: '15:00', winnerId: null, status: 'SCHEDULED' }
    ] as Match[];
  }, [activeTicketIdx, selections, teams, round1Matches, round2Matches, round3Matches]);

  const finalMatch = useMemo(() => {
    const sel = selections[activeTicketIdx];
    const s1WinnerId = sel['derived_s1'];
    const s2WinnerId = sel['derived_s2'];
    const s1Winner = semiMatches[0].teamA?.id === s1WinnerId ? semiMatches[0].teamA : semiMatches[0].teamB;
    const s2Winner = semiMatches[1].teamA?.id === s2WinnerId ? semiMatches[1].teamA : semiMatches[1].teamB;

    return {
      id: 'derived_f1',
      phase: 'FINAL',
      teamA: s1Winner || null,
      teamB: s2Winner || null,
      startTime: '16:00',
      winnerId: null,
      status: 'SCHEDULED'
    } as Match;
  }, [semiMatches, selections, activeTicketIdx]);

  // --- LOGIC ---

  const handleSelect = (matchId: string, teamId: string) => {
    setSelections(prev => {
      const next = [...prev];
      const current = { ...next[activeTicketIdx], [matchId]: teamId };
      if (!matchId.startsWith('derived')) {
        delete current['derived_s1']; delete current['derived_s2']; delete current['derived_f1'];
      } else if (matchId.startsWith('derived_s')) {
        delete current['derived_f1'];
      }
      next[activeTicketIdx] = current;
      return next;
    });
  };

  const canAdvance = () => {
    const sel = selections[activeTicketIdx];
    if (step === 'GROUP_1') return round1Matches.length > 0 && round1Matches.every(m => sel[m.id]);
    if (step === 'GROUP_2') return round2Matches.length > 0 && round2Matches.every(m => sel[m.id]);
    if (step === 'GROUP_3') return round3Matches.length > 0 && round3Matches.every(m => sel[m.id]);
    if (step === 'SEMIS') return sel['derived_s1'] && sel['derived_s2'];
    if (step === 'FINAL') return sel['derived_f1'];
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    window.scrollTo(0, 0);
    if (step === 'GROUP_1') setStep('GROUP_2');
    else if (step === 'GROUP_2') setStep('GROUP_3');
    else if (step === 'GROUP_3') setStep('SEMIS');
    else if (step === 'SEMIS') setStep('FINAL');
    else if (step === 'FINAL') {
      if (isLoggedIn) setStep('SUMMARY');
      else setStep('REGISTER');
    }
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    if (step === 'GROUP_2') setStep('GROUP_1');
    else if (step === 'GROUP_3') setStep('GROUP_2');
    else if (step === 'SEMIS') setStep('GROUP_3');
    else if (step === 'FINAL') setStep('SEMIS');
    else if (step === 'UPSELL') {
      if (ticketsToBuy === 1) setStep('FINAL');
      else if (ticketsToBuy === 2) { setStep('FINAL'); setActiveTicketIdx(1); } // Return to 2nd ticket finalization
    }
    else if (step === 'REGISTER') {
      if (ticketsToBuy === 3) setStep('FINAL');
      else if (ticketsToBuy === 2) setStep('FINAL');
      else setStep('UPSELL');
    }
    else if (step === 'SUMMARY') { if (!isLoggedIn) setStep('REGISTER'); else setStep('FINAL'); }
  };

  const renderHeader = () => (
    <header className="fixed top-0 w-full z-[100] glass-panel border-b border-white/10 px-4 py-3 flex justify-between items-center bg-black/95 h-16 shadow-2xl">
      <div onClick={() => setStep('GROUP_1')} className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <img src="/logo.jpg" alt="Fly Cup" className="w-14 h-14 object-contain rounded-full border-2 border-primary/20 group-hover:border-primary/50 transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] leading-none mb-1 italic">Palpites Especial</span>
          <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none group-hover:text-primary transition-colors">COPA FLY</h1>
        </div>
      </div>
      {isLoggedIn ? (
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-full text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 transition-all active:scale-95">
          <LogOut className="w-3 h-3" /> Sair
        </button>
      ) : (
        <button onClick={() => router.push('/login')} className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1.5 px-3 rounded-full text-[9px] font-black uppercase text-white/40 hover:text-white transition-all active:scale-95 shadow-lg">
          <LogIn className="w-3 h-3 text-primary" /> Entrar
        </button>
      )}
    </header>
  );

  const renderProgress = () => {
    const isGroup = step.startsWith('GROUP');
    const stepsArr = [
      { id: 'GROUP', label: 'Fase de Grupos', active: isGroup },
      { id: 'SEMIS', label: 'Semis', active: step === 'SEMIS' },
      { id: 'FINAL', label: 'Final', active: step === 'FINAL' }
    ];
    if (['UPSELL', 'REGISTER', 'SUMMARY', 'PAYMENT', 'SUCCESS'].includes(step)) return null;

    return (
      <div className="flex flex-col gap-4 mb-8 relative z-50">
        <div className="flex items-center justify-between px-2">
          {stepsArr.map((s, idx) => {
            const isActive = s.active;
            const isPast = stepsArr.findIndex(x => x.active) > idx;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 flex-1 relative">
                {idx > 0 && <div className={cn("absolute w-full h-[1px] right-1/2 top-4 -translate-y-1/2 -z-10", isPast || isActive ? "bg-primary/50" : "bg-white/10")} />}
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all", isActive ? "bg-primary text-black scale-110 shadow-[0_0_15px_rgba(250,204,21,0.3)]" : isPast ? "bg-primary text-black" : "bg-zinc-800 text-white/20")}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={cn("text-[7px] uppercase font-black tracking-widest text-center", isActive ? "text-primary" : "text-white/20")}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTinyBracket = () => {
    const bracket = getBracketTeams(activeTicketIdx);
    const sel = selections[activeTicketIdx];
    const s1WinnerId = sel['derived_s1'];
    const s2WinnerId = sel['derived_s2'];
    const finalWinnerId = sel['derived_f1'];

    // Correctly derive semifinal winners
    const s1W = s1WinnerId ? (s1WinnerId === bracket.a1?.id ? bracket.a1 : bracket.b2) : null;
    const s2W = s2WinnerId ? (s2WinnerId === bracket.b1?.id ? bracket.b1 : bracket.a2) : null;
    const champion = finalWinnerId ? (finalWinnerId === s1W?.id ? s1W : s2W) : null;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
        <div className="text-[7.5px] font-black uppercase text-primary tracking-[0.2em] italic mb-3 flex items-center gap-2">
          <Trophy className="w-3 h-3" /> Chaveamento Copa Fly
        </div>

        <div className="flex flex-col gap-4 px-1">
          {/* Semi 1 */}
          <div className="glass-panel p-2.5 rounded-xl border border-white/5 space-y-1.5 bg-black/40">
            <div className="flex items-center justify-between">
              <span className="text-[6px] font-black text-white/20 uppercase tracking-widest leading-none">SF1</span>
            </div>
            <div className="space-y-1">
              <div className={cn("flex items-center justify-between text-[8px] font-black uppercase p-1.5 rounded-lg border transition-all", sel['derived_s1'] === bracket.a1?.id ? "text-primary bg-primary/10 border-primary/20" : "text-white/30 border-transparent")}>
                <span className="truncate">{bracket.a1?.name || '?'}</span>
                <span className="text-[6px] opacity-40">1ºA</span>
              </div>
              <div className={cn("flex items-center justify-between text-[8px] font-black uppercase p-1.5 rounded-lg border transition-all", sel['derived_s1'] === bracket.b2?.id ? "text-primary bg-primary/10 border-primary/20" : "text-white/30 border-transparent")}>
                <span className="truncate">{bracket.b2?.name || '?'}</span>
                <span className="text-[6px] opacity-40">2ºB</span>
              </div>
            </div>
          </div>

          {/* Semi 2 */}
          <div className="glass-panel p-2.5 rounded-xl border border-white/5 space-y-1.5 bg-black/40">
            <div className="flex items-center justify-between">
              <span className="text-[6px] font-black text-white/20 uppercase tracking-widest leading-none">SF2</span>
            </div>
            <div className="space-y-1">
              <div className={cn("flex items-center justify-between text-[8px] font-black uppercase p-1.5 rounded-lg border transition-all", sel['derived_s2'] === bracket.b1?.id ? "text-primary bg-primary/10 border-primary/20" : "text-white/30 border-transparent")}>
                <span className="truncate">{bracket.b1?.name || '?'}</span>
                <span className="text-[6px] opacity-40">1ºB</span>
              </div>
              <div className={cn("flex items-center justify-between text-[8px] font-black uppercase p-1.5 rounded-lg border transition-all", sel['derived_s2'] === bracket.a2?.id ? "text-primary bg-primary/10 border-primary/20" : "text-white/30 border-transparent")}>
                <span className="truncate">{bracket.a2?.name || '?'}</span>
                <span className="text-[6px] opacity-40">2ºA</span>
              </div>
            </div>
          </div>

          {/* Final Match Display */}
          <div className="flex flex-col items-center py-1 relative">
            <div className="h-4 w-px bg-gradient-to-b from-white/10 to-primary/40" />
            <div className="glass-panel p-3 rounded-2xl border border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(250,204,21,0.1)] w-full text-center space-y-2">
              <span className="block text-[6px] font-black text-primary/40 uppercase tracking-widest">🏆 GRANDE FINAL</span>
              <div className="flex flex-col gap-1">
                <div className={cn("text-[9px] font-black uppercase italic truncate", finalWinnerId === s1W?.id ? "text-primary" : "text-white/40")}>
                  {s1W ? s1W.name : 'Aguardando...'}
                </div>
                <div className="text-[6px] text-white/10 font-black">VS</div>
                <div className={cn("text-[9px] font-black uppercase italic truncate", finalWinnerId === s2W?.id ? "text-primary" : "text-white/40")}>
                  {s2W ? s2W.name : 'Aguardando...'}
                </div>
              </div>
            </div>
          </div>

          {/* Champion Reveal */}
          {champion && (
            <div className="flex flex-col items-center mt-2 animate-in zoom-in-50 duration-700 bg-primary/5 py-3 rounded-2xl border border-primary/20 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                <Trophy className="w-5 h-5 text-black animate-bounce" />
              </div>
              <span className="text-[7px] font-black text-primary uppercase mt-3 tracking-[0.3em] italic">VENCEDOR COPA FLY</span>
              <span className="text-sm font-black text-white uppercase italic tracking-tighter drop-shadow-md">{champion.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLiveHome = () => {
    const liveMatches = matches.filter(m => m.status === 'LIVE');
    const scheduled = matches.filter(m => m.status === 'SCHEDULED');

    const renderMatch = (m: Match, isLive: boolean) => {
      const myPickId = userGuesses ? userGuesses[m.id] : null;
      const teamAPicked = m.teamA?.id === myPickId;
      const teamBPicked = m.teamB?.id === myPickId;

      return (
        <div key={m.id} className={cn(
          "glass-panel p-6 rounded-[2.5rem] border relative overflow-hidden group mb-6",
          isLive ? "border-red-500/20 bg-red-500/[0.02]" : "border-white/5 hover:border-primary/20 transition-all"
        )}>
          <div className="flex justify-between items-center mb-4 text-[7px] font-black uppercase tracking-[0.3em] italic text-white/20">
            <span>{m.phase === 'GROUP' ? `R${m.round}` : m.phase}</span>
            <span>{m.startTime}</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={cn("flex-1 p-3 rounded-xl border flex items-center gap-3", teamAPicked ? "bg-primary/10 border-primary/30" : "bg-black/40 border-white/5")}>
              <div className="w-8 h-6 bg-black rounded border border-white/5 overflow-hidden">
                {m.teamA?.logoUrl && <img src={m.teamA.logoUrl} className="w-full h-full object-cover" />}
              </div>
              <span className={cn("text-[9px] font-black uppercase truncate", teamAPicked ? "text-primary" : "text-white/40")}>{m.teamA?.name}</span>
            </div>
            <div className="text-[10px] font-black text-primary italic">{isLive ? `${m.scoreA ?? 0} - ${m.scoreB ?? 0}` : 'VS'}</div>
            <div className={cn("flex-1 p-3 rounded-xl border flex items-center gap-3", teamBPicked ? "bg-primary/10 border-primary/30" : "bg-black/40 border-white/5")}>
              <div className="w-8 h-6 bg-black rounded border border-white/5 overflow-hidden">
                {m.teamB?.logoUrl && <img src={m.teamB.logoUrl} className="w-full h-full object-cover" />}
              </div>
              <span className={cn("text-[9px] font-black uppercase truncate", teamBPicked ? "text-primary" : "text-white/40")}>{m.teamB?.name}</span>
            </div>
          </div>

          {myPickId && (
            <div className="flex items-center gap-1.5 px-1">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-[8px] font-black text-primary/40 uppercase italic tracking-widest">
                Seu Palpite: {m.teamA?.id === myPickId ? m.teamA?.name : m.teamB?.name}
              </span>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center mb-12">
          <Radio className="w-10 h-10 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">COPA FLY AO VIVO</h2>
          <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] mt-3">BLOQUEADO PARA NOVOS PALPITES</p>
        </div>

        {liveMatches.length > 0 && (
          <div className="mb-12">
            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> EM ANDAMENTO
            </h3>
            {liveMatches.map(m => renderMatch(m, true))}
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-6">PRÓXIMOS JOGOS</h3>
          {scheduled.length > 0 ? scheduled.slice(0, 5).map(m => renderMatch(m, false)) : (
            <p className="text-center text-white/10 py-10 text-[10px] font-black uppercase">Nenhum jogo agendado</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-primary gap-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse italic">Carregando Copa Fly...</span>
    </div>
  );

  if (guessesLocked && step !== 'SUCCESS') {
    return (
      <div className="min-h-screen bg-black relative">
        {renderHeader()}
        <main className="min-h-screen pb-44 flex flex-col relative overflow-x-hidden pt-20">
          <div className="container mx-auto px-4 flex-1 flex flex-col max-w-lg">
            {/* Notice Bar */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-10 pb-44">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 animate-pulse">
                <Lock className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase text-center leading-tight mb-4 px-10">
                OS JOGOS JÁ <span className="text-red-500 not-italic">COMEÇARAM</span>
              </h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic text-center px-12 leading-relaxed">
                Palpites encerrados para esta rodada.
              </p>

              <button
                onClick={() => router.push('/live')}
                className="mt-8 bg-white text-black font-black uppercase py-4 px-8 rounded-xl italic tracking-widest text-xs shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-95 transition-all flex items-center gap-2"
              >
                ACOMPANHAR AO VIVO <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (['GROUP_1', 'GROUP_2', 'GROUP_3', 'SEMIS', 'FINAL'].includes(step)) {
    const isGroupStep = step.startsWith('GROUP');
    return (
      <div className="min-h-screen bg-black relative">
        {renderHeader()}

        <main className="min-h-screen pb-44 flex flex-col relative overflow-x-hidden pt-20">
          <div className="container mx-auto px-4 flex-1 flex flex-col max-w-lg">
            {renderProgress()}



            <div className="mb-8 flex items-center justify-between px-2">
              <div className="flex flex-col text-left">
                <p className="text-white/10 text-[8px] font-black uppercase tracking-[0.4em] mb-1 italic">Simulator</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-[0.9] flex flex-col">
                  <span>{step === 'GROUP_1' ? 'RODADA 01' :
                    step === 'GROUP_2' ? 'RODADA 02' :
                      step === 'GROUP_3' ? 'RODADA 03' :
                        step === 'SEMIS' ? 'SEMI' : 'GRANDE'}</span>
                  <span className="text-primary not-italic font-sans">{step === 'SEMIS' ? 'FINAIS' : step === 'FINAL' ? 'FINAL' : 'GRUPOS'}</span>
                </h2>
              </div>

              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className={cn(
                  "group flex items-center gap-2.5 py-1.5 px-3.5 rounded-xl border transition-all active:scale-95 shadow-lg",
                  showSimulator ? "bg-zinc-900 border-white/10" : "bg-primary border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                )}
              >
                <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center border", showSimulator ? "bg-zinc-800 border-white/5 text-white/40" : "bg-black border-black text-primary animate-pulse")}>
                  {showSimulator ? <X className="w-3 h-3" /> : <LayoutDashboard className="w-3 h-3" />}
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className={cn("text-[5px] font-black uppercase tracking-widest", showSimulator ? "text-white/20" : "text-black/60")}>Simulador</span>
                  <span className={cn("text-[8px] font-black uppercase italic tracking-tighter", showSimulator ? "text-white" : "text-black")}>{showSimulator ? 'Fechar' : 'Ver sua Tabela'}</span>
                </div>
              </button>
            </div>

            <div className="flex gap-4 flex-1 h-full relative">
              {/* Left Column (Matches) */}
              <div className={cn(
                "overflow-y-auto overflow-x-hidden space-y-4 pb-48 scrollbar-hide duration-700 ease-in-out transition-all px-1",
                showSimulator ? "flex-[0.45] scale-100" : "flex-1 scale-100 flex flex-col items-center"
              )}>
                {(step === 'SEMIS' ? semiMatches : step === 'FINAL' ? [finalMatch] : currentMatches).map((match: Match) => (
                  <div key={match.id} className={cn("w-full transition-all", !showSimulator && "max-w-md")}>
                    <GameCard
                      match={match}
                      isVertical={showSimulator}
                      selection={selections[activeTicketIdx][match.id] || null}
                      onSelect={(teamId) => handleSelect(match.id, teamId)}
                    />
                  </div>
                ))}

                {/* Navigation Buttons inside Scroll */}
                <div className="pt-10 pb-44 w-full max-w-md flex flex-col gap-3">
                  <button
                    onClick={handleNext}
                    disabled={!canAdvance()}
                    className={cn(
                      "w-full h-16 rounded-2xl font-black italic uppercase text-lg tracking-widest transition-all active:scale-95 flex items-center justify-between px-8",
                      canAdvance()
                        ? "bg-primary text-black shadow-[0_10px_30px_rgba(250,204,21,0.3)]"
                        : "bg-zinc-900/50 text-white/10 border border-white/5 cursor-not-allowed"
                    )}
                  >
                    <span>{step === 'FINAL' ? 'CONCLUIR' : 'PRÓXIMO PASSO'}</span>
                    <ArrowRight className={cn("w-6 h-6", canAdvance() ? "animate-bounce-x" : "opacity-10")} />
                  </button>

                  <button
                    onClick={handleBack}
                    className="w-full py-4 text-[9px] font-black uppercase text-white/20 tracking-[0.4em] italic hover:text-white transition-all flex items-center justify-center gap-2"
                    disabled={step === 'GROUP_1'}
                  >
                    <ChevronLeft className="w-3 h-3" /> Voltar
                  </button>
                </div>
              </div>

              {/* Right Column (Simulator) */}
              <div className={cn(
                "overflow-y-auto overflow-x-hidden pb-48 scrollbar-hide transition-all duration-700 ease-in-out h-full",
                showSimulator ? "flex-[0.55] opacity-100 translate-x-0" : "flex-[0] opacity-0 translate-x-32 pointer-events-none"
              )}>
                {showSimulator && (
                  <div className="space-y-4">
                    {isGroupStep ? (
                      <>
                        <SimulatorStandings teams={teams} selections={selections[activeTicketIdx]} group="A" matches={matches} isMobile />
                        <SimulatorStandings teams={teams} selections={selections[activeTicketIdx]} group="B" matches={matches} isMobile />
                        <button
                          onClick={() => { setShowSimulator(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="w-full mt-4 bg-zinc-900 border border-white/5 py-4 rounded-xl flex items-center justify-center gap-2 text-[8px] font-black uppercase text-white/40 hover:text-white transition-all active:scale-95 shadow-lg group"
                        >
                          <X className="w-3 h-3 text-red-500/50 group-hover:text-red-500" /> Fechar Simulador
                        </button>
                      </>
                    ) : (
                      renderTinyBracket()
                    )}
                  </div>
                )}
              </div>

              {/* Scroll Hint Gradient */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />
            </div>

          </div>
        </main>


        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes bounce-x {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(5px); }
          }
          .animate-bounce-x {
            animation: bounce-x 1s infinite;
          }
        `}</style>
      </div>
    );
  }

  // --- SUMMARY STEP (Gamified Edition) ---
  if (step === 'SUMMARY') {
    return (
      <main className="min-h-screen bg-black relative overflow-x-hidden w-full">
        <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.05),transparent_70%)] pointer-events-none" />
        {renderHeader()}
        <div className="flex flex-col items-center w-full pb-60 px-4">
          <div className="text-center mb-8 pt-24 relative z-10 w-full flex flex-col items-center">
            <Trophy className="w-10 h-10 text-primary mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-pulse" />
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">REVISÃO FINAL</h1>
            <div className="text-[10px] text-primary font-black tracking-[0.4em] uppercase bg-primary/10 py-2 rounded-full px-6 inline-block italic border border-primary/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]">{userCpf}</div>
          </div>

          <div className="space-y-10 w-full max-w-md mb-16 relative z-10">
            {[0, 1, 2].map(ticketIdx => {
              if (ticketIdx >= ticketsToBuy) return null;
              const standingsA = calculateStandings('A', ticketIdx);
              const standingsB = calculateStandings('B', ticketIdx);
              const bracketTeams = { a1: standingsA[0], a2: standingsA[1], b1: standingsB[0], b2: standingsB[1] };

              return (
                <BracketVisual
                  key={ticketIdx}
                  selections={selections[ticketIdx]}
                  bracket={bracketTeams}
                  standingsA={standingsA}
                  standingsB={standingsB}
                  matches={matches}
                  ticketIdx={ticketIdx}
                />
              );
            })}
          </div>

          <div className="fixed bottom-24 left-0 w-full p-4 z-[100] flex flex-col gap-3 bg-black/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => handleBack()}
              className="w-full bg-zinc-900 border border-white/10 text-white/40 font-black uppercase py-4 rounded-2xl text-[9px] tracking-[0.3em] hover:text-white transition-all italic flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowLeft className="w-3 h-3" /> REVISAR PALPITES
            </button>
            <button
              onClick={() => setStep('PAYMENT')}
              className="w-full bg-primary text-black font-black italic uppercase py-5 rounded-2xl flex items-center justify-between px-6 shadow-[0_15px_40px_rgba(250,204,21,0.3)] transition-all active:scale-95 group"
            >
              <div className="text-left flex flex-col justify-center">
                <span className="text-[8px] opacity-60 font-black tracking-widest leading-none uppercase mb-0.5">FINALIZAR</span>
                <span className="text-sm font-black italic leading-none">PAGAR E REGISTRAR</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-3xl font-black tracking-tightest">R$ 0,10</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }



  // --- REGISTER STEP ---
  if (step === 'REGISTER') {
    const handleRegSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!regData.name || !regData.cpf || !regData.email || !regData.password) return setRegError('Todos os campos são obrigatórios.');
      if (!validateCPF(regData.cpf)) return setRegError('CPF inválido.');
      localStorage.setItem('copa_user_cpf', regData.cpf);
      localStorage.setItem('copa_user_name', regData.name);
      localStorage.setItem('copa_user_email', regData.email);
      setIsLoggedIn(true); setUserCpf(regData.cpf); setStep('SUMMARY'); window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return (
      <main className="min-h-screen p-6 pt-24 bg-black overflow-y-auto">
        {renderHeader()}
        <div className="w-full max-w-md bg-zinc-950/50 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 mx-auto shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 rotate-3 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">QUASE LÁ!</h2>
            <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.4em] italic">Crie sua conta Fly Cup para salvar seus palpites</p>
          </div>

          <form onSubmit={handleRegSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Seu Nome Completo</label>
              <input type="text" placeholder="EX: JOÃO SILVA" className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-white font-black uppercase text-[12px] outline-none focus:border-primary/40 focus:bg-black/60 transition-all shadow-xl" value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Seu CPF (Sem pontos)</label>
              <input type="text" placeholder="000.000.000-00" className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-white font-mono text-center tracking-[0.4em] text-sm outline-none focus:border-primary/40 focus:bg-black/60 transition-all shadow-xl" value={regData.cpf} onChange={(e) => setRegData({ ...regData, cpf: formatCPF(e.target.value) })} maxLength={14} />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">E-mail para contato</label>
              <input type="email" placeholder="EXEMPLO@EMAIL.COM" className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-white font-black uppercase text-[12px] outline-none focus:border-primary/40 focus:bg-black/60 transition-all shadow-xl" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Crie uma senha forte</label>
              <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-white text-center focus:border-primary/40 focus:bg-black/60 outline-none transition-all shadow-xl" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} />
            </div>

            {regError && (
              <div className="bg-red-500/10 border border-red-500/20 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 animate-pulse">
                <X className="w-4 h-4 text-red-500" />
                <p className="text-red-500 text-[9px] font-black uppercase tracking-widest italic">{regError}</p>
              </div>
            )}

            <button type="submit" className="group w-full bg-primary text-black font-black uppercase py-7 rounded-[2rem] shadow-[0_20px_60px_rgba(250,204,21,0.3)] italic tracking-widest text-xl active:scale-95 transition-all mt-6 flex items-center justify-center gap-3">
              FINALIZAR CADASTRO <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (step === 'PAYMENT') {
    const finalPrice = ticketsToBuy === 1 ? 0.10 : ticketsToBuy === 2 ? 0.15 : 0.20;
    const handleFinalize = async () => {
      setIsPaying(true);
      try {
        const allBets = selections.slice(0, ticketsToBuy).flatMap((sel, idx) => {
          const standingsA = calculateStandings('A', idx);
          const standingsB = calculateStandings('B', idx);
          const bracketTeams = { a1: standingsA[0], a2: standingsA[1], b1: standingsB[0], b2: standingsB[1] };
          return [
            ...groupMatches.map(m => ({ matchId: m.id, selectedTeamId: sel[m.id] })),
            { matchId: 'derived_s1', selectedTeamId: sel['derived_s1'] },
            { matchId: 'derived_s2', selectedTeamId: sel['derived_s2'] },
            { matchId: 'derived_f1', selectedTeamId: sel['derived_f1'] }
          ];
        });
        const customerName = regData.name || localStorage.getItem('copa_user_name') || 'Nome não informado';
        const customerEmail = regData.email || localStorage.getItem('copa_user_email') || 'email@naoinformado.com';

        const res = await fetch('/api/checkout', {
          method: 'POST',
          body: JSON.stringify({
            cpf: userCpf,
            amount: finalPrice,
            customerName,
            customerEmail,
            password: regData.password,
            bets: allBets
          })
        });
        const data = await res.json();
        if (data.success) setPixData(data); else alert('Erro ao gerar cobrança.');
      } catch (err) { alert('Erro de conexão.'); } finally { setIsPaying(false); }
    };
    if (!pixData && !isPaying) handleFinalize();
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black pt-20 overflow-x-hidden">
        {renderHeader()}
        <div className="glass-panel p-10 rounded-[3.5rem] w-full max-w-sm border border-white/10 shadow-3xl text-center relative overflow-hidden animate-in zoom-in-95 backdrop-blur-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-white to-primary animate-pulse" />
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">PAGAMENTO PIX</h2>
          <p className="text-[10px] text-white/30 font-black tracking-[0.3em] mb-10 uppercase italic">ESCANEIE OU COPIE O CÓDIGO</p>
          <div className="bg-white p-6 rounded-[3rem] mb-10 w-64 h-64 mx-auto shadow-2xl transition-transform hover:scale-105 duration-500 border-4 border-primary/20">
            {isPaying ? <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-20" /> : <img src={pixData?.pix_qr_code} className="w-full h-full" />}
          </div>

          <div className="space-y-3 mb-10">
            <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-[7px] font-black text-white/20 uppercase tracking-widest text-left">Código Pix</span>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-primary font-mono truncate text-left flex-1">{pixData?.pix_copy_paste || '...'}</span>
                <button
                  onClick={() => {
                    if (pixData) {
                      navigator.clipboard.writeText(pixData.pix_copy_paste);
                      setPixCopied(true);
                      setTimeout(() => setPixCopied(false), 2000);
                    }
                  }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                    pixCopied ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-primary text-black"
                  )}
                >
                  {pixCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              for (let i = 0; i < ticketsToBuy; i++) {
                const sel = selections[i];
                const standingsA = calculateStandings('A', i);
                const standingsB = calculateStandings('B', i);
                await saveTicket({
                  cpf: userCpf,
                  status: 'PENDING', // Enhanced: mark as pending until webhook confirmation
                  total_price: finalPrice,
                  customer_email: regData.email || localStorage.getItem('copa_user_email') || '',
                  password: regData.password || ''
                }, [
                  ...groupMatches.map(m => ({ matchId: m.id, selectedTeamId: sel[m.id] })),
                  { matchId: 'derived_s1', selectedTeamId: sel['derived_s1'] },
                  { matchId: 'derived_s2', selectedTeamId: sel['derived_s2'] },
                  { matchId: 'derived_f1', selectedTeamId: sel['derived_f1'] }
                ]);
              }
              setStep('SUCCESS'); window.scrollTo(0, 0);
            }}
            className="w-full bg-primary text-black font-black uppercase py-6 rounded-[2rem] shadow-[0_20px_60px_rgba(250,204,21,0.4)] text-2xl italic active:scale-95 transition-all relative z-[110]"
          >
            JÁ PAGUEI!
          </button>
        </div>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-black text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1),transparent_70%)]" />
        <div className="w-40 h-40 rounded-[3.5rem] bg-green-500 flex items-center justify-center mb-12 shadow-[0_0_100px_rgba(34,197,94,0.5)] animate-bounce relative z-10"><CheckCircle2 className="w-20 h-20 text-black" /></div>
        <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none relative z-10">TUDO PRONTO!</h2>
        <p className="text-white/40 mb-16 uppercase text-[12px] font-black tracking-[0.5em] italic relative z-10">Desejamos boa sorte na Copa Fly!</p>
        <div className="space-y-4 w-full max-w-xs relative z-10 px-6">
          <button onClick={() => router.push('/tickets')} className="w-full bg-white text-black font-black py-7 rounded-[2.5rem] shadow-3xl italic tracking-[0.2em] text-xl active:scale-95 transition-all group flex items-center justify-center gap-3">
            VER MEUS BILHETES <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
          <button
            onClick={() => { setStep('GROUP_1'); setTicketsToBuy(1); setActiveTicketIdx(0); window.scrollTo(0, 0); }}
            className="w-full bg-white/5 hover:bg-white/10 text-white/40 font-black uppercase py-4 rounded-2xl text-[10px] tracking-[0.3em] transition-all italic active:scale-95 border border-white/5"
          >
            FAZER NOVO PALPITE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-primary gap-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse italic">Carregando Copa Fly...</span>
    </div>
  );
}
