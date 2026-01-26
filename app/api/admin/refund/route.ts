import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { ticketId } = await req.json();
        const supabase = getAdminClient();
        const apiKey = process.env.PAGARME_API_KEY;

        if (!apiKey) throw new Error('PAGARME_API_KEY not configured');

        // 1. Fetch ticket and payment_id
        const { data: ticket, error: tError } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single();

        if (tError || !ticket) throw new Error('Ticket not found');
        if (!ticket.payment_id) throw new Error('Ticket has no payment_id associated');

        console.log(`Starting refund for Ticket ${ticketId} (Pagarme Order: ${ticket.payment_id})`);

        // 2. Fetch Order from Pagarme to get Charge ID
        const orderResponse = await fetch(`https://api.pagar.me/core/v5/orders/${ticket.payment_id}`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) {
            console.error('Error fetching Pagarme order:', orderData);
            throw new Error(`Pagarme: ${orderData.message || 'Error fetching order'}`);
        }

        const charge = orderData.charges?.[0];
        if (!charge) throw new Error('No charges found for this order');

        const chargeId = charge.id;
        console.log(`Charge ID found: ${chargeId}. Initiating refund...`);

        // 3. Request Refund from Pagarme
        // For Pix, the amount is usually required or defaults to total. 
        // We'll refund the full amount.
        const refundResponse = await fetch(`https://api.pagar.me/core/v5/charges/${chargeId}/refund`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: Math.round(ticket.total_price * 100)
            })
        });

        const refundData = await refundResponse.json();
        if (!refundResponse.ok) {
            console.error('Pagarme Refund Error:', refundData);
            throw new Error(`Pagarme Refund: ${refundData.message || 'Error processing refund'}`);
        }

        console.log('Refund successful at Pagarme:', JSON.stringify(refundData));

        // 4. Update Ticket status in Supabase
        const { error: uError } = await supabase
            .from('tickets')
            .update({ status: 'REFUNDED' })
            .eq('id', ticketId);

        if (uError) throw uError;

        return NextResponse.json({ success: true, message: 'Reembolso processado com sucesso.' });

    } catch (error: any) {
        console.error('Refund API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
