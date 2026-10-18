import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Extensión derivada del MIME (nunca del nombre del archivo)
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB (límite de body en Vercel ≈ 4.5 MB)
const BUCKET = 'property-photos';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!seller) return NextResponse.json({ error: 'Sin permisos de vendedor' }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 });

  const ext = MIME_EXT[file.type];
  if (!ext) return NextResponse.json({ error: 'Solo JPG, PNG o WebP' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Máximo 4 MB por foto' }, { status: 400 });

  // La policy de storage exige que la primera carpeta sea auth.uid()
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false, cacheControl: '3600' });

  if (upErr) {
    console.error('[seller/upload] error:', upErr);
    return NextResponse.json({ error: 'No se pudo subir la imagen' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl, path });
}
