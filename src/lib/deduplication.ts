import { PropertyEntity } from './supabase/types';

/**
 * Servicio de Deduplicación para InmobiliariaPY V3
 * El objetivo es generar una firma única (hash) basada en atributos físicos
 * para identificar si una propiedad ya existe independientemente de quién la anuncie.
 */

export interface DeduplicationParams {
  city: string;
  neighborhood: string;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  latitude?: number;
  longitude?: number;
}

export class DeduplicationService {
  /**
   * Genera un hash de similitud basado en atributos físicos inmutables.
   * Se normalizan los datos para evitar duplicados por errores de tipeo o espacios.
   */
  static generateSimilarityHash(params: DeduplicationParams): string {
    const normalizedCity = params.city.toLowerCase().trim();
    const normalizedNeighborhood = params.neighborhood.toLowerCase().trim();
    const sqm = Math.round(params.sqm);
    const beds = params.bedrooms;
    const baths = params.bathrooms;

    // Creamos una cadena con los valores clave
    // Formato: city|neighborhood|sqm|beds|baths
    const hashString = `${normalizedCity}|${normalizedNeighborhood}|${sqm}|${beds}|${baths}`;

    return this.hashString(hashString);
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `sim_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Compara dos propiedades para determinar si son la misma entidad física.
   * Implementa un margen de error para los m2 (±5%).
   */
  static areSimilar(p1: DeduplicationParams, p2: DeduplicationParams): boolean {
    const cityMatch = p1.city.toLowerCase().trim() === p2.city.toLowerCase().trim();
    const neighborhoodMatch = p1.neighborhood.toLowerCase().trim() === p2.neighborhood.toLowerCase().trim();
    const bedsMatch = p1.bedrooms === p2.bedrooms;
    const bathsMatch = p1.bathrooms === p2.bathrooms;

    // Margen de error del 5% para los metros cuadrados
    const sqmDiff = Math.abs(p1.sqm - p2.sqm);
    const sqmMargin = p1.sqm * 0.05;
    const sqmMatch = sqmDiff <= sqmMargin;

    // Si hay coordenadas, la coincidencia es casi absoluta (margen de ~10 metros)
    if (p1.latitude && p1.longitude && p2.latitude && p2.longitude) {
      const dist = this.getDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      if (dist < 0.01) return true; // Menos de 10 metros es la misma propiedad
    }

    return cityMatch && neighborhoodMatch && bedsMatch && bathsMatch && sqmMatch;
  }

  /**
   * Calcula la distancia en km entre dos puntos (Haversine formula)
   */
  private static getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
