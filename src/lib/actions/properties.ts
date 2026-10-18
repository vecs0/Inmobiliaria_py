'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateListingEmbedding } from '@/lib/ai/embeddings';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type ActionResult = { ok: boolean; error?: string };

export interface CreatePropertyInput {
  // Entidad física
  city: string;
  neighborhood: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  year_built?: number | null;
  floor?: number | null;
  // Listing comercial
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'PYG';
  operation_type: 'venta' | 'alquiler';
  image: string;
  images: string[];
  amenities: string[];
  tag?: string | null;
  status?: 'active' | 'draft';
  /** @deprecated Ignorado: `featured` solo lo asigna el sistema de boosts (service role). */
  featured?: boolean;
  /** @deprecated Ignorado: el seller_profile se resuelve en el servidor desde la sesión. */
  seller_profile_id?: string;
}

export interface UpdatePropertyInput {
  listingId: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'PYG';
  operation_type: 'venta' | 'alquiler';
  image: string;
  images: string[];
  amenities: string[];
  status?: 'active' | 'draft' | 'paused';
  city: string;
  neighborhood: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
}

// ─── Validación ──────────────────────────────────────────────────────────────

const urlOrPath = z.string().trim().max(1000);

const listingFields = {
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(10000),
  price: z.number().finite().positive().max(1e13),
  currency: z.enum(['USD', 'PYG']),
  operation_type: z.enum(['venta', 'alquiler']),
  image: urlOrPath,
  images: z.array(urlOrPath).max(40),
  amenities: z.array(z.string().trim().max(80)).max(60),
};

const entityFields = {
  city: z.string().trim().min(1).max(120),
  neighborhood: z.string().trim().max(120),
  address: z.string().trim().max(300),
  bedrooms: z.number().int().min(0).max(100),
  bathrooms: z.number().int().min(0).max(100),
  sqm: z.number().finite().min(0).max(10_000_000),
  parking: z.number().int().min(0).max(100),
};

// .strip() (default) descarta claves desconocidas → `featured` y `seller_profile_id` nunca llegan a la DB
const CreateSchema = z.object({
  ...listingFields,
  ...entityFields,
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  type: z.string().trim().min(1).max(40),
  year_built: z.number().int().min(1800).max(2100).nullish(),
  floor: z.number().int().min(-10).max(300).nullish(),
  tag: z.string().trim().max(40).nullish(),
  status: z.enum(['active', 'draft']).optional(),
});

const UpdateSchema = z.object({
  listingId: z.string().trim().min(1).max(100),
  ...listingFields,
  ...entityFields,
  status: z.enum(['active', 'draft', 'paused']).optional(),
});

const IdSchema = z.string().trim().min(1).max(100);

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

type SellerCtx = {
  supabase: ServerSupabase;
  userId: string;
  sellerProfileId: string;
  maxProperties: number;
};

async function getSellerContext(): Promise<SellerCtx | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { data: sp } = await supabase
    .from('seller_profiles')
    .select('id, max_properties, seller_type')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!sp) return { error: 'Perfil de vendedor no encontrado.' };

  const maxProperties =
    (sp.max_properties as number | null) ?? (sp.seller_type === 'empresa' ? 50 : 5);
  return { supabase, userId: user.id, sellerProfileId: sp.id as string, maxProperties };
}

async function countActiveListings(ctx: SellerCtx, excludeId?: string): Promise<number> {
  let q = ctx.supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('seller_profile_id', ctx.sellerProfileId)
    .eq('status', 'active');
  if (excludeId) q = q.neq('id', excludeId);
  const { count } = await q;
  return count ?? 0;
}

async function getOwnedListing(ctx: SellerCtx, id: string) {
  const { data } = await ctx.supabase
    .from('listings')
    .select('id, entity_id, status, seller_profile_id')
    .eq('id', id)
    .maybeSingle();
  if (!data || data.seller_profile_id !== ctx.sellerProfileId) return null;
  return data as { id: string; entity_id: string | null; status: string; seller_profile_id: string };
}

function revalidateListingPaths(listingId?: string) {
  revalidatePath('/vendedor');
  revalidatePath('/vendedor/propiedades');
  revalidatePath('/propiedades');
  if (listingId) revalidatePath(`/propiedades/${listingId}`);
}

function scheduleEmbedding(listingId: string) {
  after(async () => {
    try {
      await generateListingEmbedding(listingId);
    } catch (e) {
      console.error('[properties] embedding error:', e);
    }
  });
}

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : fallback;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createListing(
  input: CreatePropertyInput
): Promise<{ success: boolean; ok: boolean; error?: string; listingId?: string; entityId?: string }> {
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.') ?? '';
    return { success: false, ok: false, error: `Datos inválidos${field ? `: ${field}` : ''}.` };
  }
  const data = parsed.data;

  const ctx = await getSellerContext();
  if ('error' in ctx) return { success: false, ok: false, error: ctx.error };

  const status = data.status ?? 'active';
  if (status === 'active') {
    const active = await countActiveListings(ctx);
    if (active >= ctx.maxProperties) {
      return { success: false, ok: false, error: 'Has alcanzado el límite de propiedades activas de tu plan.' };
    }
  }

  try {
    // Entidad física propia (no se reutilizan entidades de otros vendedores)
    const entityId = crypto.randomUUID();
    const { error: entityErr } = await ctx.supabase.from('property_entities').insert({
      id: entityId,
      city: data.city,
      neighborhood: data.neighborhood,
      address: data.address || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqm: data.sqm,
      parking: data.parking,
      year_built: data.year_built ?? null,
      floor: data.floor ?? null,
    });
    if (entityErr) throw entityErr;

    const listingId = crypto.randomUUID();
    const { error: listingErr } = await ctx.supabase.from('listings').insert({
      id: listingId,
      entity_id: entityId,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      operation_type: data.operation_type,
      image: data.image || data.images[0] || '',
      images: data.images,
      amenities: data.amenities,
      tag: data.tag ?? null,
      seller_profile_id: ctx.sellerProfileId,
      status,
      source: 'direct',
      published_at: status === 'active' ? new Date().toISOString() : null,
    });
    if (listingErr) {
      await ctx.supabase.from('property_entities').delete().eq('id', entityId);
      throw listingErr;
    }

    // Contador (best-effort; el decremento lo hace un trigger en DELETE)
    await ctx.supabase.rpc('increment_properties_count', { profile_id: ctx.sellerProfileId });

    scheduleEmbedding(listingId);
    revalidateListingPaths(listingId);
    return { success: true, ok: true, listingId, entityId };
  } catch (e) {
    console.error('Error in createListing:', e);
    return { success: false, ok: false, error: errMessage(e, 'Error interno al crear la propiedad.') };
  }
}

export async function updateListing(
  input: UpdatePropertyInput
): Promise<{ success: boolean; ok: boolean; error?: string }> {
  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.') ?? '';
    return { success: false, ok: false, error: `Datos inválidos${field ? `: ${field}` : ''}.` };
  }
  const data = parsed.data;

  const ctx = await getSellerContext();
  if ('error' in ctx) return { success: false, ok: false, error: ctx.error };

  const existing = await getOwnedListing(ctx, data.listingId);
  if (!existing) return { success: false, ok: false, error: 'Propiedad no encontrada.' };

  if (data.status === 'active' && existing.status !== 'active') {
    const active = await countActiveListings(ctx, existing.id);
    if (active >= ctx.maxProperties) {
      return { success: false, ok: false, error: 'Has alcanzado el límite de propiedades activas de tu plan.' };
    }
  }

  try {
    const { error: listingErr } = await ctx.supabase
      .from('listings')
      .update({
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        operation_type: data.operation_type,
        image: data.image || data.images[0] || '',
        images: data.images,
        amenities: data.amenities,
        ...(data.status ? { status: data.status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('seller_profile_id', ctx.sellerProfileId);
    if (listingErr) throw listingErr;

    if (existing.entity_id) {
      const { error: entErr } = await ctx.supabase
        .from('property_entities')
        .update({
          city: data.city,
          neighborhood: data.neighborhood,
          address: data.address || null,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          sqm: data.sqm,
          parking: data.parking,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.entity_id);
      if (entErr) console.error('updateListing: entity update error:', entErr);
    }

    scheduleEmbedding(existing.id);
    revalidateListingPaths(existing.id);
    return { success: true, ok: true };
  } catch (e) {
    console.error('Error in updateListing:', e);
    return { success: false, ok: false, error: errMessage(e, 'Error interno al actualizar.') };
  }
}

export async function deleteListing(id: string): Promise<ActionResult> {
  const parsedId = IdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'ID inválido.' };

  const ctx = await getSellerContext();
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const existing = await getOwnedListing(ctx, parsedId.data);
  if (!existing) return { ok: false, error: 'Propiedad no encontrada.' };

  const { error } = await ctx.supabase
    .from('listings')
    .delete()
    .eq('id', existing.id)
    .eq('seller_profile_id', ctx.sellerProfileId);
  if (error) {
    console.error('Error in deleteListing:', error);
    return { ok: false, error: 'No se pudo eliminar la propiedad.' };
  }

  revalidateListingPaths(existing.id);
  return { ok: true };
}

export async function setListingStatus(id: string, status: 'active' | 'paused'): Promise<ActionResult> {
  const parsedId = IdSchema.safeParse(id);
  const parsedStatus = z.enum(['active', 'paused']).safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { ok: false, error: 'Datos inválidos.' };

  const ctx = await getSellerContext();
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const existing = await getOwnedListing(ctx, parsedId.data);
  if (!existing) return { ok: false, error: 'Propiedad no encontrada.' };
  if (existing.status === parsedStatus.data) return { ok: true };

  if (parsedStatus.data === 'active') {
    const active = await countActiveListings(ctx, existing.id);
    if (active >= ctx.maxProperties) {
      return { ok: false, error: 'Has alcanzado el límite de propiedades activas de tu plan.' };
    }
  }

  const { error } = await ctx.supabase
    .from('listings')
    .update({ status: parsedStatus.data, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .eq('seller_profile_id', ctx.sellerProfileId);
  if (error) {
    console.error('Error in setListingStatus:', error);
    return { ok: false, error: 'No se pudo cambiar el estado.' };
  }

  revalidateListingPaths(existing.id);
  return { ok: true };
}

export async function getPropertiesByIds(ids: string[]) {
  const parsed = z.array(IdSchema).max(100).safeParse(ids);
  if (!parsed.success) return { success: false as const, error: 'IDs inválidos.' };
  if (parsed.data.length === 0) return { success: true as const, data: [] as Record<string, unknown>[] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties_full')
    .select('*')
    .in('id', parsed.data)
    .eq('status', 'active');

  if (error) {
    console.error('Error in getPropertiesByIds:', error);
    return { success: false as const, error: error.message };
  }
  return { success: true as const, data: (data ?? []) as Record<string, unknown>[] };
}
