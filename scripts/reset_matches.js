const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetMatches() {
    console.log('Resetting all matches to 0-0 and SCHEDULED...');

    const { error } = await supabase
        .from('matches')
        .update({
            score_a: 0,
            score_b: 0,
            status: 'SCHEDULED',
            winner_id: null
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all

    if (error) {
        console.error('Error resetting matches:', error);
    } else {
        console.log('All matches have been reset successfully!');
    }
}

resetMatches();
