import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';

// Tipos permitidos para imágenes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function OPTIONS(req: NextRequest) {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  return new NextResponse(null, { status: 204 });
}

async function verifyAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { authorized: false, error: 'No autenticado' };
  }
  
  // Verificar que el usuario tenga rol de agent o admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!profile || (profile.role !== 'agent' && profile.role !== 'admin')) {
    return { authorized: false, error: 'Sin permisos' };
  }
  
  return { authorized: true };
}

export async function POST(request: NextRequest) {
  const corsPreflight = handleCors(request);
  if (corsPreflight) return corsPreflight;
  
  // Verificar autenticación
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    const response = NextResponse.json({ error: auth.error }, { status: 401 });
    return addCorsHeaders(response);
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      const response = NextResponse.json({ error: 'No file provided' }, { status: 400 });
      return addCorsHeaders(response);
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      const response = NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo imágenes: JPG, PNG, WebP, GIF' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      const response = NextResponse.json(
        { error: 'El archivo excede el límite de 5MB' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const supabase = await createClient();

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    // Convertir File a ArrayBuffer para upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('properties-images')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('properties-images')
      .getPublicUrl(fileName);

    const response = NextResponse.json({ url: publicUrl, fileName });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Upload error:', error);
    const response = NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}