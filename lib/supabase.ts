import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmrofwmqltmhfgcbixwn.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Tipos para la tabla dropbox_tokens
 */
export interface DropboxTokenRow {
  id: number;
  app_name: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  account_id: string;
  uid: string | null;
  obtained_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type DropboxTokenInsert = Omit<DropboxTokenRow, 'id' | 'created_at' | 'updated_at'>;
export type DropboxTokenUpdate = Partial<DropboxTokenInsert>;
