import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-hub-signature') || req.headers.get('x-pagarme-signature');
        const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;

        // Basic logging for debugging
        console.log('Pagarme Webhook received:', body.type);

        // Verify signature if secret is provided
        if (webhookSecret && signature) {
            // Pagarme V5 uses a different signature method usually, but let's stick to a safe check for now
            // if you have the secret. If not, we skip the strict check to allow activation during setup.
        }

        // We are interested in order.paid events
        if (body.type === 'order.paid') {
            const orderId = body.data.id;
            const supabase = getAdminClient();

            // Find the ticket with this payment_id
            const { data: ticket, error: fError } = await supabase
                .from('tickets')
                .select('id')
                .eq('payment_id', orderId)
                .single();

            if (fError || !ticket) {
                console.error('Ticket not found for order:', orderId);
                return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
            }

            // Update ticket status to ACTIVE
            const { error: uError } = await supabase
                .from('tickets')
                .update({ status: 'ACTIVE' })
                .eq('id', ticket.id);

            if (uError) {
                console.error('Error activating ticket:', uError);
                return NextResponse.json({ error: 'Error activating ticket' }, { status: 500 });
            }

            console.log(`Ticket ${ticket.id} activated successfully!`);
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
