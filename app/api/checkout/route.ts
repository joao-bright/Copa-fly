import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

// This would be a real Pagarme API call in production
export async function POST(req: Request) {
    try {
        const { cpf, amount, customerName, customerEmail, customerPhone, password, bets } = await req.json();
        const supabase = getAdminClient();
        const apiKey = process.env.PAGARME_API_KEY;

        if (!apiKey) throw new Error('PAGARME_API_KEY not configured');

        // Check if guesses are locked
        let guessesLocked = false;
        try {
            const { data: lockSettings, error: sError } = await supabase.from('settings').select('value').eq('key', 'guesses_locked').maybeSingle();
            if (!sError && lockSettings) {
                guessesLocked = lockSettings.value === true || lockSettings.value === 'true';
            }
        } catch (e) {
            console.warn('Settings table check failed, skipping lock check:', e);
        }

        if (guessesLocked) {
            return NextResponse.json({ success: false, error: 'As apostas estão encerradas para este torneio.' }, { status: 403 });
        }

        // 1. Create a PENDING ticket in Supabase
        const { data: ticket, error: tError } = await supabase
            .from('tickets')
            .insert([{
                cpf,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                password,
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
        const genericAddress = {
            line_1: 'Avenida Paulista, 1000',
            zip_code: '01311000',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR'
        };

        const payload = {
            customer: {
                name: customerName,
                email: customerEmail,
                type: 'individual',
                document: cpf.replace(/\D/g, ''), // Clean CPF
                address: genericAddress, // Added to customer object for extra validation safety
                phones: {
                    mobile_phone: {
                        country_code: '55',
                        area_code: customerPhone ? customerPhone.replace(/\D/g, '').slice(0, 2) : '11',
                        number: customerPhone ? customerPhone.replace(/\D/g, '').slice(2) : '999999999'
                    }
                }
            },
            items: [
                {
                    amount: Math.round(amount * 100), // Converts to cents (ensure integer)
                    description: `Copa Fly - Bilhete ${ticket.id.slice(0, 8)}`,
                    quantity: 1
                }
            ],
            shipping: {
                description: `Copa Fly - Bilhete ${ticket.id.slice(0, 8)}`,
                address: genericAddress
            },
            payments: [
                {
                    payment_method: 'pix',
                    pix: {
                        expires_in: 3600 // 1 hour
                    }
                }
            ]
        };

        console.log('Sending request to Pagarme:', JSON.stringify(payload, null, 2));

        const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const pagarmeData = await pagarmeResponse.json();
        console.log('Pagarme response status:', pagarmeResponse.status);
        console.log('Pagarme response data:', JSON.stringify(pagarmeData, null, 2));

        if (!pagarmeResponse.ok) {
            console.error('Pagarme API Error:', JSON.stringify(pagarmeData, null, 2));
            const errorMsg = pagarmeData?.message || pagarmeData?.errors?.[0]?.message || 'Error generating payment';
            throw new Error(errorMsg);
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
