import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Checking Database Schema ---');

    // Checking teams table for 'team_group'
    const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(1);
    if (teamsError) {
        console.error('Teams Table Error:', teamsError.message);
    } else {
        console.log('Teams sample:', teams);
    }

    // Checking matches table columns
    // We'll try to insert a dummy match and see if it fails on missing columns
    const { data: testMatch, error: matchError } = await supabase.from('matches').insert([{
        phase: 'GROUP',
        round: 1,
        team_group: 'A',
        start_time: '00:00'
    }]);

    if (matchError) {
        console.error('Match Insert Error (Phase/Group/Round check):', matchError.message);
    } else {
        console.log('Match insert success! (Match columns are OK)');
        // Cleanup
        if (testMatch) {
            await supabase.from('matches').delete().eq('id', testMatch[0].id);
        }
    }
}

checkSchema();
