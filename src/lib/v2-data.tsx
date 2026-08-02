/* Datos mock alineados a PropertyFull + ZONES_PY ? fallback si Supabase no responde */

import { formatPrice, mapPropertyFromApi, type V2Property } from './property-adapter';

export const IMG = {
  hero1: 'https://images.unsplash.com/photo-1613553474179-e1eda3ea5734?w=1600&q=80',
  v1: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  v2: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  v3: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  v4: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
  v5: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
  v6: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  v7: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
  v8: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
  v9: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80',
  v10: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
  v11: 'https://images.unsplash.com/photo-1600573472556-e636c2acda88?w=1200&q=80',
  v12: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80',
  zone1: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1400&q=80',
  zone2: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80',
  zone3: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&q=80',
  zone4: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&q=80',
  zone5: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80',
  zone6: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1400&q=80',
  agent: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
  agent2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
};

export const ZONES = [
  { slug: 'villa-morra', name: 'Villa Morra', city: 'Asunción', count: 84, rentability: '7-9%', appreciation: '8-10%', profile: 'Ejecutivos y diplomáticos', img: IMG.zone1 },
  { slug: 'carmelitas', name: 'Carmelitas', city: 'Asunción', count: 67, rentability: '6-8%', appreciation: '7-9%', profile: 'Familias y profesionales', img: IMG.zone2 },
  { slug: 'trinidad', name: 'Trinidad', city: 'Asunción', count: 54, rentability: '8-10%', appreciation: '9-11%', profile: 'Jóvenes profesionales', img: IMG.zone3 },
  { slug: 'san-bernardino', name: 'San Bernardino', city: 'San Bernardino', count: 31, rentability: '10-15%', appreciation: '12-15%', profile: 'Turismo y casas de verano', img: IMG.zone4 },
  { slug: 'encarnacion', name: 'Encarnación', city: 'Encarnación', count: 41, rentability: '9-13%', appreciation: '10-14%', profile: 'Turismo y jubilados', img: IMG.zone5 },
  { slug: 'ciudad-del-este', name: 'Ciudad del Este', city: 'Ciudad del Este', count: 38, rentability: '8-12%', appreciation: '7-9%', profile: 'Comercio internacional', img: IMG.zone6 },
];

export const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Penthouse', 'Terreno', 'Oficina', 'Local'] as const;
export const OPERATION_TYPES = ['venta', 'alquiler'] as const;
export const CURRENCIES = ['USD', 'PYG'] as const;

const RAW_PROPERTIES = [
  { id: 'PY-0241', type: 'Casa', operation_type: 'venta', title: 'Residencia con jardín en Villa Morra', neighborhood: 'Villa Morra', city: 'Asunción', loc: 'Villa Morra, Asunción', price: 485000, currency: 'USD', bedrooms: 4, bathrooms: 3, sqm: 320, image: IMG.v1, status: 'active', boosted: true, agent_name: 'María José Benítez', agent_photo: IMG.agent },
  { id: 'PY-0188', type: 'Penthouse', operation_type: 'venta', title: 'Penthouse en Carmelitas', neighborhood: 'Carmelitas', city: 'Asunción', loc: 'Carmelitas, Asunción', price: 312000, currency: 'USD', bedrooms: 3, bathrooms: 2, sqm: 185, image: IMG.v2, status: 'active', boosted: true, agent_name: 'Andrés Martínez', agent_photo: IMG.agent2 },
  { id: 'PY-0317', type: 'Casa', operation_type: 'venta', title: 'Casa minimalista con piscina', neighborhood: 'Trinidad', city: 'Asunción', loc: 'Trinidad, Asunción', price: 268000, currency: 'USD', bedrooms: 4, bathrooms: 3, sqm: 240, image: IMG.v3, status: 'active', agent_name: 'María José Benítez', agent_photo: IMG.agent },
  { id: 'PY-0402', type: 'Apartamento', operation_type: 'alquiler', title: 'Loft urbano frente al Costanera', neighborhood: 'Centro', city: 'Asunción', loc: 'Centro, Asunción', price: 1800, currency: 'USD', bedrooms: 2, bathrooms: 2, sqm: 120, image: IMG.v4, status: 'active', agent_name: 'María José Benítez', agent_photo: IMG.agent },
  { id: 'PY-0099', type: 'Casa', operation_type: 'venta', title: 'Casa de campo en San Bernardino', neighborhood: 'San Bernardino', city: 'San Bernardino', loc: 'San Bernardino', price: 425000, currency: 'USD', bedrooms: 5, bathrooms: 4, sqm: 410, image: IMG.v5, status: 'active', boosted: true, agent_name: 'Andrés Martínez', agent_photo: IMG.agent2 },
  { id: 'PY-0512', type: 'Apartamento', operation_type: 'alquiler', title: 'Studio frente al río Paraguay', neighborhood: 'Costanera', city: 'Asunción', loc: 'Costanera, Asunción', price: 950, currency: 'USD', bedrooms: 1, bathrooms: 1, sqm: 75, image: IMG.v6, status: 'active', agent_name: 'María José Benítez', agent_photo: IMG.agent },
  { id: 'PY-0227', type: 'Casa', operation_type: 'venta', title: 'Villa contemporánea con cancha', neighborhood: 'Luque', city: 'Luque', loc: 'Luque, Central', price: 520000, currency: 'USD', bedrooms: 5, bathrooms: 5, sqm: 480, image: IMG.v7, status: 'active', agent_name: 'Andrés Martínez', agent_photo: IMG.agent2 },
  { id: 'PY-0364', type: 'Apartamento', operation_type: 'venta', title: 'Dúplex en Las Mercedes', neighborhood: 'Las Mercedes', city: 'Asunción', loc: 'Las Mercedes, Asunción', price: 358000, currency: 'USD', bedrooms: 3, bathrooms: 3, sqm: 210, image: IMG.v8, status: 'active', agent_name: 'María José Benítez', agent_photo: IMG.agent },
  { id: 'PY-0451', type: 'Casa', operation_type: 'venta', title: 'Casa tropical en Encarnación', neighborhood: 'Encarnación', city: 'Encarnación', loc: 'Encarnación, Itapúa', price: 295000, currency: 'USD', bedrooms: 4, bathrooms: 3, sqm: 280, image: IMG.v9, status: 'active', agent_name: 'Andrés Martínez', agent_photo: IMG.agent2 },
  { id: 'PY-0573', type: 'Casa', operation_type: 'venta', title: 'Casa frente al lago en Ypacaraí', neighborhood: 'Ypacaraí', city: 'Ypacaraí', loc: 'Ypacaraí, Central', price: 612000, currency: 'USD', bedrooms: 5, bathrooms: 4, sqm: 520, image: IMG.v10, status: 'active', agent_name: 'María José Benítez', agent_photo: IMG.agent },
  { id: 'PY-0118', type: 'Local', operation_type: 'alquiler', title: 'Local comercial en CDE', neighborhood: 'Ciudad del Este', city: 'Ciudad del Este', loc: 'Ciudad del Este, Alto Paraná', price: 2400, currency: 'USD', bedrooms: 0, bathrooms: 1, sqm: 95, image: IMG.v11, status: 'active', agent_name: 'Andrés Martínez', agent_photo: IMG.agent2 },
  { id: 'PY-0625', type: 'Apartamento', operation_type: 'venta', title: 'Apartamento con vista panorámica', neighborhood: 'Recoleta', city: 'Asunción', loc: 'Recoleta, Asunción', price: 240000, currency: 'USD', bedrooms: 2, bathrooms: 2, sqm: 130, image: IMG.v12, status: 'active', agent_name: 'María José Benítez', agent_photo: IMG.agent },
];

export const PROPERTIES: V2Property[] = RAW_PROPERTIES.map(mapPropertyFromApi);

export { formatPrice };
