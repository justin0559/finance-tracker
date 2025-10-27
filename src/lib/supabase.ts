import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PayCycle = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  frequency_days: number;
  created_at: string;
  updated_at: string;
};

export type Bill = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number | null;
  category: string;
  is_recurring: boolean;
  frequency_type: 'weekly' | 'fortnightly' | 'monthly' | 'custom';
  frequency_days: number | null;
  next_due_date: string;
  created_at: string;
  updated_at: string;
};
