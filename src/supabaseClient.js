import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseKey) && 
  supabaseUrl !== '<YOUR_SUPABASE_PROJECT_URL>' && 
  supabaseKey !== '<YOUR_SUPABASE_PUBLISHABLE_KEY>';

// Create the Supabase client
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseKey : 'placeholder-anon-key'
);
