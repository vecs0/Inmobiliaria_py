import { NextResponse } from 'next/server';
import xml2js from 'xml2js';
import { DynamicMapper } from '@/lib/import/mapper';

/**
 * XML Parser for Real Estate Feeds
 * This endpoint receives XML data (via body or URL), transforms it into
 * the normalized format, and forwards it to the General Import API.
 */

export async function POST(req: Request) {
  try {
    const { xmlData, url, profile } = await req.json();

    let xmlContent = '';

    if (url) {
      const response = await fetch(url);
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to fetch XML from URL: ${response.statusText}` }, { status: 400 });
      }
      xmlContent = await response.text();
    } else if (xmlData) {
      xmlContent = xmlData;
    } else {
      return NextResponse.json({ error: 'Either xmlData or url must be provided' }, { status: 400 });
    }

    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(xmlContent);

    const properties = extractProperties(result, profile);

    if (properties.length === 0) {
      return NextResponse.json({ error: 'No valid properties found in the XML' }, { status: 400 });
    }

    // Forward the normalized data to the General Import API
    const importResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(properties),
    });

    const importResult = await importResponse.json();

    return NextResponse.json({
      success: importResponse.ok,
      parsed_count: properties.length,
      import_summary: importResult,
    });

  } catch (error: any) {
    console.error('XML Parser Error:', error);
    return NextResponse.json({ error: `Error processing XML: ${error.message}` }, { status: 500 });
  }
}

/**
 * Extracts properties from XML and uses the DynamicMapper to normalize fields.
 */
function extractProperties(json: any, profile: any) {
  const findPropertiesArray = (obj: any): any[] | null => {
    if (Array.isArray(obj)) return obj;
    if (typeof obj !== 'object' || obj === null) return null;

    for (const key in obj) {
      const val = obj[key];
      if (Array.isArray(val)) {
        if (val.length > 0 && (val[0].title || val[0].price || val[0].id)) {
          return val;
        }
      } else if (typeof val === 'object') {
        const found = findPropertiesArray(val);
        if (found) return found;
      }
    }
    return null;
  };

  const rawList = findPropertiesArray(json) || [];

  return rawList.map((item: any, index: number) => {
    const mapped = DynamicMapper.map(item, profile);

    return {
      city: mapped.city || 'Desconocida',
      neighborhood: mapped.neighborhood || 'Desconocida',
      address: mapped.address || '',
      latitude: parseFloat(mapped.latitude || 0),
      longitude: parseFloat(mapped.longitude || 0),
      type: (mapped.type || 'house').toLowerCase() as any,
      bedrooms: parseInt(mapped.bedrooms || 0),
      bathrooms: parseInt(mapped.bathrooms || 0),
      sqm: parseFloat(mapped.sqm || 0),
      parking: parseInt(mapped.parking || 0),
      year_built: parseInt(mapped.year_built || 0),
      floor: parseInt(mapped.floor || 0),
      title: mapped.title || `Propiedad ${index}`,
      description: mapped.description || '',
      price: parseFloat(mapped.price || 0),
      currency: (mapped.currency || 'USD').toUpperCase() as 'USD' | 'PYG',
      operation_type: (mapped.operation_type || 'venta').toLowerCase() as 'venta' | 'alquiler',
      image: mapped.image || '',
      images: Array.isArray(mapped.images) ? mapped.images : (mapped.images ? [mapped.images] : []),
      amenities: Array.isArray(mapped.amenities) ? mapped.amenities : (mapped.amenities ? [mapped.amenities] : []),
      tag: mapped.tag || '',
      featured: !!mapped.featured,
      external_id: item.id || item.external_id || `xml_${Date.now()}_${index}`,
      source: 'xml_import' as const,
      agent_id: item.agent_id || undefined,
    };
  });
}
