import { Zone, ZONES_PY } from './zones';

/**
 * Convierte un texto en un slug SEO-friendly.
 * Ejemplo: "Villa Morra, Asunción" -> "villa-morra-asuncion"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Quita acentos
    .replace(/\s+/g, '-')            // Espacios por guiones
    .replace(/[^a-z0-9-]/g, '')      // Quita caracteres no alfanuméricos excepto guiones
    .replace(/-+/g, '-')             // Evita guiones dobles
    .trim()
    .replace(/^-|-$/g, '');          // Quita guiones al inicio o final
}

/**
 * Intenta recuperar el nombre real de una zona a partir de su slug.
 * Si no encuentra el slug en la lista de zonas conocidas, capitaliza el slug.
 */
export function deslugify(slug: string): string {
  const zone = getZoneBySlug(slug);
  if (zone) return zone.name;

  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Busca una zona completa por su slug en el catálogo ZONES_PY.
 */
export function getZoneBySlug(slug: string): Zone | undefined {
  return ZONES_PY.find(zone => zone.slug === slug);
}

/**
 * Filtra todas las zonas que pertenecen a una ciudad específica.
 */
export function getZonesByCity(city: string): Zone[] {
  return ZONES_PY.filter(zone =>
    zone.city.toLowerCase() === city.toLowerCase()
  );
}
