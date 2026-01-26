const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
    console.log('Cleaning database...');

    // Delete guesses first (if not cascading)
    const { error: eth } = await supabase.from('bets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (eth) console.error('Error cleaning bets:', eth);

    // Delete tickets
    const { error: et } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (et) console.error('Error cleaning tickets:', et);

    console.log('Database cleaned!');
}

clean();
