import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  try {
    const { propertyId, sellerId } = await req.json();
    if (!propertyId) return NextResponse.json({ ok: false }, { status: 400 });

    // Hash del IP para deduplicar sin almacenar PII
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ipHash = createHash('sha256').update(ip + propertyId).digest('hex').slice(0, 16);

    const supabase = await createClient();
    await supabase.from('property_views').insert([{
      property_id: propertyId,
      seller_id: sellerId ?? null,
      ip_hash: ipHash,
      user_agent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
    }]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
