
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple .env parser since we can't assume dotenv is installed, though we could just mock it.
// Reading .env manually
const envPath = path.resolve(process.cwd(), '.env');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf-8');
} catch (e) {
    console.error("Could not read .env file");
    process.exit(1);
}

const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Supabase Connection...");

    // Check if we can query projects
    const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("Connection Failed:", error.message);
        // If error is related to table not found, it means connection works but migration needed (which user did potentially)
        if (error.code === '42P01') {
            console.error("Tables not found. Did you run the SQL script?");
        }
    } else {
        console.log("Connection Successful! Projects Table Accessibility: OK");
    }
}

check();
