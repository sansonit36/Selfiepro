import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION: UPDATE THESE VALUES
// ------------------------------------------------------------------
// You can find these in your Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rhlvvcxoigtlydkwiknr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHZ2Y3hvaWd0bHlka3dpa25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1Mzk0NjIsImV4cCI6MjA4MTExNTQ2Mn0.N4p5lZq3fxjYbijkbV_ZzcLtaKM1TbcDAHEreMftoZo';

if (SUPABASE_URL.includes('INSERT_YOUR') || SUPABASE_ANON_KEY.includes('INSERT_YOUR')) {
  console.error("Supabase credentials missing!");
  // We use a timeout to ensure the UI renders before the alert blocks execution
  setTimeout(() => {
    alert("⚠️ CONFIGURATION REQUIRED ⚠️\n\nPlease open 'services/supabaseClient.ts' and replace the placeholder text with your actual Supabase URL and Anon Key.");
  }, 1000);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);