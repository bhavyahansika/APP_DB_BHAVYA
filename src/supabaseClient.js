import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const TEACHER_EMAIL_DOMAIN = import.meta.env.VITE_TEACHER_EMAIL_DOMAIN || 'school.edu';

export const isConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseKey) && 
  supabaseUrl !== '<YOUR_SUPABASE_PROJECT_URL>' && 
  supabaseKey !== '<YOUR_SUPABASE_PUBLISHABLE_KEY>';

// Create the Supabase client
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Deterministically maps Teacher ID (e.g., "T001" or "t001") to school email (e.g. "t001@school.edu").
 * If user already entered a full email, ensures lowercase and trimmed.
 */
export function formatTeacherEmail(teacherIdInput) {
  if (!teacherIdInput) return '';
  const cleaned = teacherIdInput.trim().toLowerCase();
  if (cleaned.includes('@')) {
    return cleaned;
  }
  return `${cleaned}@${TEACHER_EMAIL_DOMAIN}`;
}

/**
 * Extracts a readable Teacher ID from the email (e.g., "t001@school.edu" -> "T001")
 */
export function extractTeacherId(email) {
  if (!email) return 'Teacher';
  const prefix = email.split('@')[0];
  return prefix.toUpperCase();
}
