import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DeduplicationService, DeduplicationParams } from '@/lib/deduplication';
import { PropertyEntity, Listing } from '@/lib/supabase/types';

interface ImportItem {
  // Datos físicos
  city: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  type: PropertyEntity['type'];
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  year_built?: number;
  floor?: number;
  // Datos comerciales
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'PYG';
  operation_type: 'venta' | 'alquiler';
  image: string;
  images: string[];
  amenities: string[];
  tag?: string;
  featured: boolean;
  // Trazabilidad
  external_id: string;
  source: 'xml_import' | 'csv_import' | 'api_import';
  agent_id?: string;
}

export async function POST(req: Request) {
  try {
    const properties = await req.json();

    if (!Array.isArray(properties)) {
      return NextResponse.json({ error: 'El cuerpo de la solicitud debe ser un array de propiedades' }, { status: 400 });
    }

    const supabase = await createClient();
    const results = {
      imported: 0,
      deduplicated: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const item of properties) {
      try {
        // 1. Preparar parámetros de deduplicación
        const dedupParams: DeduplicationParams = {
          city: item.city,
          neighborhood: item.neighborhood,
          sqm: item.sqm,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          latitude: item.latitude,
          longitude: item.longitude,
        };

        // 2. Generar Hash de similitud
        const similarityHash = DeduplicationService.generateSimilarityHash(dedupParams);

        // 3. Buscar entidad existente por Hash o Coordenadas
        let { data: existingEntity, error: entityError } = await supabase
          .from('property_entities')
          .select('id')
          .or(`similarity_hash.eq.${similarityHash},latitude.eq.${item.latitude}`)
          .maybeSingle();

        let entityId: string;

        if (existingEntity) {
          entityId = existingEntity.id;
          results.deduplicated++;
        } else {
          // 4. Crear nueva entidad física
          const { data: newEntity, error: createEntityError } = await supabase
            .from('property_entities')
            .insert({
              ...dedupParams,
              address: item.address,
              type: item.type,
              year_built: item.year_built,
              floor: item.floor,
              similarity_hash: similarityHash
            })
            .select('id')
            .single();

          if (createEntityError) throw createEntityError;
          entityId = newEntity.id;
        }

        // 5. Crear el listing comercial vinculado a la entidad
        const { error: listingError } = await supabase
          .from('listings')
          .insert({
            entity_id: entityId,
            title: item.title,
            description: item.description,
            price: item.price,
            currency: item.currency,
            operation_type: item.operation_type,
            image: item.image,
            images: item.images,
            amenities: item.amenities,
            tag: item.tag,
            featured: item.featured,
            source: item.source,
            external_id: item.external_id,
            agent_id: item.agent_id,
            status: 'active'
          });

        if (listingError) throw listingError;

        results.imported++;
      } catch (itemError: any) {
        results.errors++;
        results.details.push({
          title: item.title,
          error: itemError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: results
    });

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: 'Error interno al procesar la importación' }, { status: 500 });
  }
}
