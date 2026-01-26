import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase variables. Ensure .env.local is loaded.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
    console.log('--- Initializing Supabase Storage ---');

    // 1. Create bucket
    const { data, error } = await supabase.storage.createBucket('logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 2097152 // 2MB
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Bucket "logos" already exists.');
        } else {
            console.error('❌ Error creating bucket:', error.message);
            console.log('Please ensure the SUPABASE_SERVICE_ROLE_KEY is correct in .env.local');
            return;
        }
    } else {
        console.log('✅ Bucket "logos" created successfully.');
    }

    console.log('--- Storage setup complete! ---');
    console.log('Note: You may still need to add RLS policies manually in the dashboard if the key used is not a Service Role key.');
}

setupStorage();
