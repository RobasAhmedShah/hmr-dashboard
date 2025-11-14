import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://klglyxwyrjtjsxfzbzfv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZ2x5eHd5cmp0anN4ZnpiemZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTA4MTEsImV4cCI6MjA3ODY4NjgxMX0.HmiohptSawnbWD14Ohk5UJX9B-k1-D2tdorjp4uUZJg';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

console.log('🔧 Supabase initialized:', { url: supabaseUrl, hasKey: !!supabaseAnonKey });

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

