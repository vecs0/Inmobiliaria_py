export interface ImportMappingProfile {
  name: string;
  mappings: {
    city?: string;
    neighborhood?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    type?: string;
    bedrooms?: string;
    bathrooms?: string;
    sqm?: string;
    parking?: string;
    year_built?: string;
    floor?: string;
    title?: string;
    description?: string;
    price?: string;
    currency?: string;
    operation_type?: string;
    image?: string;
    images?: string;
    amenities?: string;
    tag?: string;
    featured?: string;
  };
}

export class DynamicMapper {
  /**
   * Maps a raw XML item to the normalized import format based on a profile.
   * If a field is not mapped in the profile, it falls back to the heuristic mapping.
   */
  static map(item: any, profile: ImportMappingProfile | null): any {
    // Heuristic fallback mappings
    const fallbacks = {
      city: ['city', 'location_city', 'ciudad'],
      neighborhood: ['neighborhood', 'zona', 'barrio'],
      address: ['address', 'direccion', 'calle'],
      latitude: ['latitude', 'lat'],
      longitude: ['longitude', 'lng'],
      type: ['type', 'tipo_propiedad', 'categoria'],
      bedrooms: ['bedrooms', 'habitaciones', 'dormitorios'],
      bathrooms: ['bathrooms', 'banos', 'baños'],
      sqm: ['sqm', 'superficie', 'area', 'metros_cuadrados'],
      parking: ['parking', 'estacionamiento', 'cochera'],
      year_built: ['year_built', 'anio_construccion'],
      floor: ['floor', 'piso', 'planta'],
      title: ['title', 'titulo', 'nombre'],
      description: ['description', 'descripcion', 'texto'],
      price: ['price', 'precio', 'valor'],
      currency: ['currency', 'moneda'],
      operation_type: ['operation_type', 'tipo_operacion', 'operacion'],
      image: ['image', 'foto_principal', 'img'],
      images: ['images', 'fotos', 'galeria'],
      amenities: ['amenities', 'servicios', 'comodidades'],
      tag: ['tag', 'etiqueta'],
      featured: ['featured', 'destacado'],
    };

    const result: any = {};

    // Use profile mapping if available, otherwise search through fallbacks
    Object.keys(fallbacks).forEach((key) => {
      const targetField = key as keyof typeof fallbacks;
      const mappedKey = profile?.mappings[targetField as keyof ImportMappingProfile['mappings']] || fallbacks[targetField as keyof typeof fallbacks][0];

      // Try the specific mapped key first, then try all fallbacks for that field
      let value: any = item[mappedKey];

      if (value === undefined || value === null) {
        for (const fallbackKey of fallbacks[targetField as keyof typeof fallbacks]) {
          if (item[fallbackKey] !== undefined && item[fallbackKey] !== null) {
            value = item[fallbackKey];
            break;
          }
        }
      }

      result[targetField] = value;
    });

    return result;
  }
}
