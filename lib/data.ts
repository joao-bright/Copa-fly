import { supabase } from './supabase';
import { Match, Team, Ticket } from './types';

// Fallback data for safety before DB is populated
export const MOCK_TEAMS: Team[] = [
    { id: 't1', name: 'Falcons', logoUrl: '' },
    { id: 't2', name: 'Eagles', logoUrl: '' },
    { id: 't3', name: 'Tigers', logoUrl: '' },
    { id: 't4', name: 'Lions', logoUrl: '' },
    { id: 't5', name: 'Sharks', logoUrl: '' },
    { id: 't6', name: 'Wolves', logoUrl: '' },
    { id: 't7', name: 'Bears', logoUrl: '' },
    { id: 't8', name: 'Bulls', logoUrl: '' },
];

export const getTeams = async (): Promise<Team[]> => {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching teams:', error);
        return [];
    }

    return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        logoUrl: t.logo_url,
        group: t.team_group
    }));
};

export const createTeam = async (team: { name: string, logoUrl?: string, group?: string }) => {
    const { data, error } = await supabase
        .from('teams')
        .insert([{
            name: team.name,
            logo_url: team.logoUrl,
            team_group: team.group
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateTeam = async (id: string, updates: Partial<Team>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.group !== undefined) dbUpdates.team_group = updates.group;

    const { data, error } = await supabase.from('teams').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url
    };
};

export const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
};

export const uploadTeamLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `teams/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const getMatches = async (): Promise<Match[]> => {
    const { data, error } = await supabase
        .from('matches')
        .select(`
      *,
      teamA:team_a_id(*),
      teamB:team_b_id(*)
    `)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching matches:', error);
        return [];
    }

    // Transform DB snakes to camelCase for the app
    return data.map((m: any) => ({
        id: m.id,
        phase: m.phase,
        round: m.round,
        group: m.team_group,
        teamA: m.teamA ? { id: m.teamA.id, name: m.teamA.name, logoUrl: m.teamA.logo_url } : null,
        teamB: m.teamB ? { id: m.teamB.id, name: m.teamB.name, logoUrl: m.teamB.logo_url } : null,
        winnerId: m.winner_id,
        status: m.status,
        startTime: m.start_time,
        scoreA: m.score_a,
        scoreB: m.score_b,
        streamUrl: m.stream_url
    }));
};

export const createMatch = async (matchData: any) => {
    const { data, error } = await supabase
        .from('matches')
        .insert([{
            phase: matchData.phase,
            round: matchData.round,
            team_group: matchData.group,
            team_a_id: matchData.teamAId,
            team_b_id: matchData.teamBId,
            start_time: matchData.startTime,
            status: 'SCHEDULED'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const saveTicket = async (ticketData: any, bets: any[]) => {
    const { data: ticket, error: tError } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

    if (tError) throw tError;

    const betsToInsert = bets.map(b => ({
        ticket_id: ticket.id,
        match_id: b.matchId,
        selected_team_id: b.selectedTeamId
    }));

    const { error: bError } = await supabase.from('bets').insert(betsToInsert);
    if (bError) throw bError;

    return ticket;
};

export const updateTicketBets = async (ticketId: string, bets: any[]) => {
    // 1. Delete existing bets for this ticket
    const { error: dError } = await supabase
        .from('bets')
        .delete()
        .eq('ticket_id', ticketId);

    if (dError) throw dError;

    // 2. Insert new bets
    const betsToInsert = bets.map(b => ({
        ticket_id: ticketId,
        match_id: b.matchId,
        selected_team_id: b.selectedTeamId
    }));

    const { error: iError } = await supabase.from('bets').insert(betsToInsert);
    if (iError) throw iError;
};
export const getTicketById = async (id: string): Promise<Ticket | null> => {
    const { data, error } = await supabase
        .from('tickets')
        .select(`
            *,
            bets(
                match_id,
                selected_team_id
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching ticket:', error);
        return null;
    }

    return {
        id: data.id,
        cpf: data.cpf,
        status: data.status,
        createdAt: data.created_at,
        bets: data.bets.map((b: any) => ({
            matchId: b.match_id,
            selectedTeamId: b.selected_team_id
        }))
    } as Ticket;
};
