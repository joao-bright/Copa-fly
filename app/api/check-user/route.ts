
import { getAdminClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cpf = searchParams.get('cpf');

        if (!cpf) {
            return NextResponse.json({ error: 'CPF required' }, { status: 400 });
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from('tickets')
            .select('id')
            .eq('cpf', cpf.replace(/\D/g, '')) // Clean CPF for query
            .single();

        if (error || !data) {
            return NextResponse.json({ hasTicket: false });
        }

        return NextResponse.json({ hasTicket: true, ticketId: data.id });
    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json({ error: 'Internal User Check Error' }, { status: 500 });
    }
}
