import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Guest = {
  id: string;
  external_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  preferred_name: string | null;
  housing_status: string;
  age_group: string;
  gender: string;
};

export type MealAttendance = {
  id: string;
  guest_id: string | null;
  meal_type: 'guest' | 'extra' | 'rv' | 'shelter' | 'united_effort' | 'day_worker' | 'lunch_bag';
  quantity: number;
  served_on: string;
  recorded_at: string;
  notes: string | null;
};
