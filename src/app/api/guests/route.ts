import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GUEST_SELECT = `id, external_id, first_name, last_name, full_name, preferred_name, housing_status, age_group, gender`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = (url.searchParams.get('q') ?? '').trim();

  if (query.length < 2) {
    return NextResponse.json({ guests: [] });
  }

  const { data, error } = await supabase
    .from('guests')
    .select(GUEST_SELECT)
    .or(`full_name.ilike.%${query}%,preferred_name.ilike.%${query}%,external_id.ilike.%${query}%`)
    .order('full_name', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Guest search failed', error);
    return NextResponse.json(
      { message: 'Unable to search guests right now' },
      { status: 500 }
    );
  }

  return NextResponse.json({ guests: data ?? [] });
}
