import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log debug chi tiết theo yêu cầu
console.log("🛠 [Supabase Init] URL:", supabaseUrl);
console.log("🛠 [Supabase Init] KEY exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('🚨 Missing Supabase environment variables! Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
