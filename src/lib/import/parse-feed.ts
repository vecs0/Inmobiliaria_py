import xml2js from 'xml2js';
import { DynamicMapper, type ImportMappingProfile } from '@/lib/import/mapper';
import { parseCsv } from '@/lib/import/csv';

function findArray(obj: unknown): any[] | null {
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== 'object' || obj === null) return null;
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      const first = val[0] as any;
      if (val.length > 0 && first && typeof first === 'object' && (first.title || first.price || first.id)) return val;
    } else if (typeof val === 'object') {
      const found = findArray(val);
      if (found) return found;
    }
  }
  return null;
}

/** Convierte una lista de registros crudos (XML/CSV) al formato crudo de importación (sin validar). */
function mapRaw(rawList: any[], profile: ImportMappingProfile | null, source: 'xml_import' | 'csv_import') {
  return rawList.map((item) => {
    const m = DynamicMapper.map(item, profile);
    const list = (v: unknown): string[] =>
      Array.isArray(v) ? v.map(String)
        : typeof v === 'string' && v ? v.split(/[|;,]/).map((s) => s.trim()).filter(Boolean)
        : v && typeof v === 'object' ? Object.values(v as object).flat().map(String)
        : [];
    return {
      ...m,
      images: list(m.images),
      amenities: list(m.amenities),
      external_id: item.id ?? item.external_id ?? item.referencia ?? undefined,
      source,
    };
  });
}

export async function parseXmlItems(xml: string, profile: ImportMappingProfile | null = null) {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  const parsed = await parser.parseStringPromise(xml);
  const raw = findArray(parsed) ?? [];
  return mapRaw(raw, profile, 'xml_import');
}

export function parseCsvItems(csv: string, profile: ImportMappingProfile | null = null) {
  return mapRaw(parseCsv(csv), profile, 'csv_import');
}

/** Detecta CSV vs XML por contenido. */
export function detectFormat(text: string): 'xml' | 'csv' {
  return text.trimStart().startsWith('<') ? 'xml' : 'csv';
}
