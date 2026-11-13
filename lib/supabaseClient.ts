import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // @ts-ignore
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  // @ts-ignore
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

  return env[key] || env[`VITE_${key}`] || metaEnv[key] || metaEnv[`VITE_${key}`] || '';
};

// Sanitiza URLs para prevenir que /rest/v1/ o barras finales rompan el endpoint de Supabase
export const sanitizeSupabaseUrl = (raw: string): string => {
  if (!raw) return '';
  return raw.trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/+$/, '');
};

export const sanitizeSupabaseKey = (raw: string): string => {
  if (!raw) return '';
  return raw.trim();
};

const getStoredCustomConfig = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const u = localStorage.getItem('kinetix_custom_supabase_url');
      const k = localStorage.getItem('kinetix_custom_supabase_key');
      return { url: u || '', key: k || '' };
    }
  } catch (e) {
    // Ignore
  }
  return { url: '', key: '' };
};

const DEFAULT_SUPABASE_URL = 'https://cckcpwqsolovddlzlkuo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_uouTiNM4nKG87oUmobPL4Q_XO6kcvD9';

const customConfig = getStoredCustomConfig();

const rawUrl = getEnv('SUPABASE_URL') || customConfig.url || DEFAULT_SUPABASE_URL;
const rawKey = getEnv('SUPABASE_ANON_KEY') || customConfig.key || DEFAULT_SUPABASE_ANON_KEY;

export const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = sanitizeSupabaseKey(rawKey);

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.length > 20 && 
  !supabaseUrl.includes('placeholder')
);

const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(safeUrl, safeKey);