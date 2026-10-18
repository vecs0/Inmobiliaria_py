import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { DeduplicationService } from '@/lib/deduplication';

export const MAX_IMPORT_ITEMS = 500;

const TYPE_MAP: Record<string, string> = {
  casa: 'Casa', house: 'Casa', home: 'Casa',
  apartamento: 'Apartamento', departamento: 'Apartamento', apartment: 'Apartamento', depto: 'Apartamento',
  penthouse: 'Penthouse', duplex: 'Penthouse',
  terreno: 'Terreno', land: 'Terreno', lote: 'Terreno',
  oficina: 'Oficina', office: 'Oficina',
  local: 'Local', comercial: 'Local', commercial: 'Local', shop: 'Local',
};

const num = (def: number) =>
  z.preprocess(
    (v) => (v === '' || v == null ? def : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
    z.number().finite(),
  );
const optNum = z.preprocess(
  (v) => (v === '' || v == null ? null : typeof v === 'string' ? Number(v.replace(',', '.')) : v),
  z.number().finite().nullable(),
);
const strArr = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? v.map(String)
      : typeof v === 'string' && v
        ? v.split(/[|;,]/).map((s) => s.trim()).filter(Boolean)
        : [],
  z.array(z.string()).max(50),
);
const bool = z.preprocess(
  (v) => v === true || v === 'true' || v === '1' || v === 1 || v === 'si' || v === 'sí',
  z.boolean(),
);

export const importItemSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.preprocess((v) => (v == null ? '' : String(v)), z.string().max(10000)),
  price: num(0).pipe(z.number().positive()),
  currency: z.preprocess((v) => String(v ?? 'USD').toUpperCase(), z.enum(['USD', 'PYG'])),
  operation_type: z.preprocess((v) => String(v ?? 'venta').toLowerCase(), z.enum(['venta', 'alquiler'])),
  city: z.string().trim().min(1).max(100),
  neighborhood: z.preprocess((v) => String(v ?? '').trim(), z.string().max(100)),
  address: z.preprocess((v) => (v ? String(v) : null), z.string().max(300).nullable()),
  latitude: optNum.pipe(z.number().min(-90).max(90).nullable()),
  longitude: optNum.pipe(z.number().min(-180).max(180).nullable()),
  type: z.preprocess((v) => TYPE_MAP[String(v ?? 'casa').toLowerCase().trim()] ?? 'Casa', z.string()),
  bedrooms: num(0).pipe(z.number().int().min(0).max(100)),
  bathrooms: num(0).pipe(z.number().int().min(0).max(100)),
  sqm: num(0).pipe(z.number().min(0).max(10_000_000)),
  parking: num(0).pipe(z.number().int().min(0).max(100)),
  year_built: optNum.pipe(z.number().int().nullable()),
  floor: optNum.pipe(z.number().int().nullable()),
  image: z.preprocess((v) => (v ? String(v) : ''), z.string().max(2000)),
  images: strArr,
  amenities: strArr,
  tag: z.preprocess((v) => (v ? String(v) : null), z.string().max(50).nullable()),
  external_id: z.preprocess((v) => (v == null || v === '' ? null : String(v)), z.string().max(200).nullable()),
  source: z.preprocess(
    (v) => (['xml_import', 'csv_import', 'api_import'].includes(String(v)) ? v : 'api_import'),
    z.enum(['xml_import', 'csv_import', 'api_import']),
  ),
  agent_id: z.preprocess((v) => (v ? String(v) : null), z.string().uuid().nullable()).catch(null),
});

export type ImportItem = z.infer<typeof importItemSchema>;

export interface ImportResultItem {
  index: number;
  title?: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  listingId?: string;
  error?: string;
}

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  deduplicated: number;
  errors: { index: number; title?: string; error: string }[];
  items: ImportResultItem[];
}

/**
 * Importa items a listings (+ property_entities) para un seller_profile.
 * `supabase` debe poder escribir (cliente admin). `items` es crudo: se valida aquí.
 */
export async function importListings(
  supabase: SupabaseClient,
  sellerProfileId: string,
  items: unknown[],
): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0, deduplicated: 0, errors: [], items: [] };
  const batch = items.slice(0, MAX_IMPORT_ITEMS);
  const seenExternal = new Set<string>();

  for (let index = 0; index < batch.length; index++) {
    const rawTitle = (batch[index] as { title?: string } | null)?.title;
    const fail = (error: string) => {
      summary.errors.push({ index, title: rawTitle, error });
      summary.items.push({ index, title: rawTitle, status: 'error', error });
    };

    const parsed = importItemSchema.safeParse(batch[index]);
    if (!parsed.success) {
      fail(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      continue;
    }
    const item = parsed.data;

    try {
      if (item.external_id) {
        if (seenExternal.has(item.external_id)) {
          summary.skipped++;
          summary.items.push({ index, title: item.title, status: 'skipped', error: 'external_id duplicado en el lote' });
          continue;
        }
        seenExternal.add(item.external_id);
      }

      const listingFields = {
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        operation_type: item.operation_type,
        image: item.image || item.images[0] || '',
        images: item.images,
        amenities: item.amenities,
        tag: item.tag,
        agent_id: item.agent_id,
        updated_at: new Date().toISOString(),
      };

      // 1. Listing existente del mismo vendedor con el mismo external_id -> actualizar
      if (item.external_id) {
        const { data: existing, error: exErr } = await supabase
          .from('listings')
          .select('id')
          .eq('seller_profile_id', sellerProfileId)
          .eq('external_id', item.external_id)
          .limit(1)
          .maybeSingle();
        if (exErr) throw exErr;
        if (existing) {
          const { error: upErr } = await supabase.from('listings').update(listingFields).eq('id', existing.id);
          if (upErr) throw upErr;
          summary.updated++;
          summary.items.push({ index, title: item.title, status: 'updated', listingId: existing.id });
          continue;
        }
      }

      // 2. Entidad física: por similarity_hash, o por (lat AND lng). Consultas separadas, sin .or() interpolado.
      const canHash = item.sqm > 0 && item.neighborhood !== '';
      const similarityHash = canHash
        ? DeduplicationService.generateSimilarityHash({
            city: item.city,
            neighborhood: item.neighborhood,
            sqm: item.sqm,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
          })
        : null;

      let entityId: string | null = null;
      if (similarityHash) {
        const { data, error } = await supabase
          .from('property_entities')
          .select('id')
          .eq('similarity_hash', similarityHash)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        entityId = data?.id ?? null;
      }
      if (!entityId && item.latitude != null && item.longitude != null) {
        const { data, error } = await supabase
          .from('property_entities')
          .select('id')
          .eq('latitude', item.latitude)
          .eq('longitude', item.longitude)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        entityId = data?.id ?? null;
      }

      if (entityId) {
        summary.deduplicated++;
      } else {
        const { data: created, error: entErr } = await supabase
          .from('property_entities')
          .insert({
            city: item.city,
            neighborhood: item.neighborhood || 'N/D',
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
            type: item.type,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            sqm: item.sqm,
            parking: item.parking,
            year_built: item.year_built,
            floor: item.floor,
            similarity_hash: similarityHash,
          })
          .select('id')
          .single();
        if (entErr) throw entErr;
        entityId = created.id as string;
      }

      // 3. Listing
      const { data: listing, error: listErr } = await supabase
        .from('listings')
        .insert({
          ...listingFields,
          entity_id: entityId,
          seller_profile_id: sellerProfileId,
          source: item.source,
          external_id: item.external_id,
          status: 'active',
          featured: false, // solo el webhook de boost puede destacar
        })
        .select('id')
        .single();
      if (listErr) throw listErr;

      summary.created++;
      summary.items.push({ index, title: item.title, status: 'created', listingId: listing.id as string });
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? 'Error desconocido';
      console.error('importListings item error:', msg);
      fail(msg);
    }
  }

  if (items.length > MAX_IMPORT_ITEMS) {
    summary.errors.push({
      index: MAX_IMPORT_ITEMS,
      error: `Se ignoraron ${items.length - MAX_IMPORT_ITEMS} items (máx ${MAX_IMPORT_ITEMS})`,
    });
  }
  return summary;
}

/** Respuesta compatible con ImportarClient/SincronizacionClient (imported/deduplicated/errors:number) + detalle. */
export function summaryToResponse(s: ImportSummary) {
  return {
    success: true,
    imported: s.created,
    updated: s.updated,
    skipped: s.skipped,
    deduplicated: s.deduplicated,
    errors: s.errors.length,
    results: { created: s.created, updated: s.updated, skipped: s.skipped, errors: s.errors },
    details: s.items,
  };
}
