import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

// This would be a real Pagarme API call in production
export async function POST(req: Request) {
    try {
        const { cpf, amount, customerName, customerEmail, bets } = await req.json();
        const supabase = getAdminClient();
        const apiKey = process.env.PAGARME_API_KEY;

        if (!apiKey) throw new Error('PAGARME_API_KEY not configured');

        // Check if guesses are locked
        const { data: lockSettings } = await supabase.from('settings').select('value').eq('key', 'guesses_locked').single();
        if (lockSettings?.value === true || lockSettings?.value === 'true') {
            return NextResponse.json({ success: false, error: 'As apostas estão encerradas para este torneio.' }, { status: 403 });
        }

        // 1. Create a PENDING ticket in Supabase
        const { data: ticket, error: tError } = await supabase
            .from('tickets')
            .insert([{
                cpf,
                status: 'PENDING',
                total_price: amount
            }])
            .select()
            .single();

        if (tError) throw tError;

        // 2. Create the bets
        const betsToInsert = bets.map((b: any) => ({
            ticket_id: ticket.id,
            match_id: b.matchId,
            selected_team_id: b.selectedTeamId
        }));
        await supabase.from('bets').insert(betsToInsert);

        // 3. Pagarme V5 Order Generation (PIX)
        const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer: {
                    name: customerName,
                    email: customerEmail,
                    type: 'individual',
                    document: cpf.replace(/\D/g, '') // Clean CPF
                },
                items: [
                    {
                        amount: amount * 100, // Converts to cents
                        description: `Copa Fly - Bilhete ${ticket.id.slice(0, 8)}`,
                        quantity: 1
                    }
                ],
                payments: [
                    {
                        payment_method: 'pix',
                        pix: {
                            expires_in: 3600 // 1 hour
                        }
                    }
                ]
            })
        });

        const pagarmeData = await pagarmeResponse.json();

        if (!pagarmeResponse.ok) {
            console.error('Pagarme API Error:', pagarmeData);
            throw new Error(pagarmeData.message || 'Error generating payment');
        }

        const charge = pagarmeData.charges?.[0];
        const pixInfo = charge?.last_transaction;

        if (!pixInfo) throw new Error('No PIX information returned from Pagarme');

        const pixData = {
            order_id: pagarmeData.id,
            pix_qr_code: pixInfo.qr_code_url,
            pix_copy_paste: pixInfo.qr_code
        };

        // Update ticket with payment ID
        await supabase.from('tickets').update({ payment_id: pixData.order_id }).eq('id', ticket.id);

        return NextResponse.json({
            success: true,
            ticketId: ticket.id,
            ...pixData
        });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
