export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  group?: string;
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';
export type Phase = 'GROUP' | 'SEMI' | 'FINAL';

export interface Match {
  id: string;
  phase: Phase;
  group?: string;
  round?: number;
  teamA: Team | null;
  teamB: Team | null;
  winnerId: string | null;
  status: MatchStatus;
  startTime: string;
  scoreA?: number;
  scoreB?: number;
  streamUrl?: string;
}

export interface Bet {
  matchId: string;
  selectedTeamId: string;
}

export type TicketStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'ELIMINATED' | 'WINNER';

export interface Ticket {
  id: string;
  userId?: string;
  userName?: string;
  cpf: string;
  bets: Bet[];
  createdAt: string;
  status: string;
  paymentId?: string;
}

export interface User {
  id: string;
  cpf: string;
  name?: string;
  phone?: string;
  tickets: string[];
}
