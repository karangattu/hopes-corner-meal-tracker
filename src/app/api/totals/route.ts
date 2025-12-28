import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTodayPacific } from '@/lib/date';

export async function GET() {
  const today = getTodayPacific();
  const { data, error } = await supabase
    .from('meal_attendance')
    .select('quantity')
    .eq('served_on', today)
    .eq('meal_type', 'guest');

  if (error) {
    console.error("Unable to load today's total", error);
    return NextResponse.json(
      { message: 'Unable to load totals' },
      { status: 500 }
    );
  }

  const total = (data ?? []).reduce((sum, row) => sum + (row.quantity ?? 0), 0);
  return NextResponse.json({ total });
}
