import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTodayPacific } from '@/lib/date';

export async function POST(req: Request) {
  const { guestId, quantity } = await req.json();
  const numericQuantity = Number(quantity);

  if (!guestId || (numericQuantity !== 1 && numericQuantity !== 2)) {
    return NextResponse.json(
      { message: 'Invalid guest ID or quantity' },
      { status: 400 }
    );
  }

  const today = getTodayPacific();

  const { data: existing, error: existingError } = await supabase
    .from('meal_attendance')
    .select('id')
    .eq('guest_id', guestId)
    .eq('served_on', today)
    .eq('meal_type', 'guest')
    .limit(1);

  if (existingError) {
    console.error('Unable to check existing meal', existingError);
    return NextResponse.json(
      { message: 'Unable to validate meal history' },
      { status: 500 }
    );
  }

  if (existing?.length) {
    return NextResponse.json(
      { message: 'Guest already received a meal today' },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase
    .from('meal_attendance')
    .insert({
      guest_id: guestId,
      meal_type: 'guest',
      quantity: numericQuantity,
      served_on: today,
    });

  if (insertError) {
    console.error('Unable to record meal', insertError);
    return NextResponse.json(
      { message: 'Unable to record meal' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
