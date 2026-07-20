import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // Intentar obtener de process.env (Vite define esto en vite.config.ts)
  // @ts-ignore
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  // Intentar obtener de import.meta.env (Standard Vite)
  // @ts-ignore
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

  return env[key] || env[`VITE_${key}`] || metaEnv[key] || metaEnv[`VITE_${key}`] || '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.length > 20 && 
  !supabaseUrl.includes('placeholder')
);

const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(safeUrl, safeKey);