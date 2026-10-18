/* Configuración estática de UI (imágenes de zonas, catálogos de tipos).
   No contiene propiedades mock: los datos de listings vienen siempre de Supabase. */

export { formatPrice } from './property-adapter';

export const IMG = {
  hero1: 'https://images.unsplash.com/photo-1613553474179-e1eda3ea5734?w=1600&q=80',
  zone1: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1400&q=80',
  zone2: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80',
  zone3: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&q=80',
  zone4: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=80',
  zone5: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80',
  zone6: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1400&q=80',
};

/** Zonas destacadas en la home. `match` = valor que se filtra en /propiedades?ciudad=
 *  (busca en city y neighborhood). El conteo se calcula en vivo desde la DB. */
export const ZONES = [
  { slug: 'villa-morra', name: 'Villa Morra', match: 'Villa Morra', img: IMG.zone1 },
  { slug: 'carmelitas', name: 'Carmelitas', match: 'Carmelitas', img: IMG.zone2 },
  { slug: 'trinidad', name: 'Trinidad', match: 'Trinidad', img: IMG.zone3 },
  { slug: 'san-bernardino', name: 'San Bernardino', match: 'San Bernardino', img: IMG.zone4 },
  { slug: 'encarnacion', name: 'Encarnación', match: 'Encarnación', img: IMG.zone5 },
  { slug: 'ciudad-del-este', name: 'Ciudad del Este', match: 'Ciudad del Este', img: IMG.zone6 },
] as const;

export const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Penthouse', 'Terreno', 'Oficina', 'Local'] as const;
export const OPERATION_TYPES = ['venta', 'alquiler'] as const;
export const CURRENCIES = ['USD', 'PYG'] as const;
export const AMENITIES_FILTER = [
  'Piscina', 'Jardín', 'Parrillero', 'Seguridad 24hs',
  'Ascensor', 'Gimnasio', 'Laundry', 'Amoblado', 'Cochera techada',
] as const;
