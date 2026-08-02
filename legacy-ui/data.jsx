/* ====================================================
   InmobiliariaPY — Shared data + Property card
   Adapted to backend schema: PropertyFull + ZONES_PY
   ==================================================== */

// Curated Unsplash image set — luxury / architecture
const IMG = {
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
  agent2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
};

// ZONES_PY — slug + city + rentabilidad (from src/lib/seo/zones.ts)
const ZONES = [
  { slug: 'villa-morra', name: 'Villa Morra', city: 'Asunción', count: 84, rentability: '7-9%', appreciation: '8-10%', profile: 'Ejecutivos y diplomáticos', img: IMG.zone1 },
  { slug: 'carmelitas', name: 'Carmelitas', city: 'Asunción', count: 67, rentability: '6-8%', appreciation: '7-9%', profile: 'Familias y profesionales', img: IMG.zone2 },
  { slug: 'trinidad', name: 'Trinidad', city: 'Asunción', count: 54, rentability: '8-10%', appreciation: '9-11%', profile: 'Jóvenes profesionales', img: IMG.zone3 },
  { slug: 'san-bernardino', name: 'San Bernardino', city: 'San Bernardino', count: 31, rentability: '10-15%', appreciation: '12-15%', profile: 'Turismo y casas de verano', img: IMG.zone4 },
  { slug: 'encarnacion', name: 'Encarnación', city: 'Encarnación', count: 41, rentability: '9-13%', appreciation: '10-14%', profile: 'Turismo y jubilados', img: IMG.zone5 },
  { slug: 'ciudad-del-este', name: 'Ciudad del Este', city: 'Ciudad del Este', count: 38, rentability: '8-12%', appreciation: '7-9%', profile: 'Comercio internacional', img: IMG.zone6 }
];

// Property types — matches PropertyEntity['type']
const PROPERTY_TYPES = ['Casa', 'Apartamento', 'Penthouse', 'Terreno', 'Oficina', 'Local'];
const OPERATION_TYPES = ['venta', 'alquiler'];
const CURRENCIES = ['USD', 'PYG'];

// PROPERTIES — shape mirrors PropertyFull (joined view)
const PROPERTIES = [
  { id: 'PY-0241', external_id: 'remax-2024-0241', type: 'Casa', operation_type: 'venta', title: 'Residencia con jardín en Villa Morra', description: 'Arquitectura contemporánea con techos altos y patio interior.', neighborhood: 'Villa Morra', city: 'Asunción', zone_slug: 'villa-morra', loc: 'Villa Morra, Asunción', price: 485000, currency: 'USD', bedrooms: 4, bathrooms: 3, sqm: 320, parking: 3, year_built: 2023, floor: null, image: IMG.v1, status: 'active', source: 'direct', featured: 'large', boosted: true, agent_name: 'María José Benítez', agent_phone: '+595 981 234 567', agent_whatsapp: '595981234567', agent_email: 'mj@inmobiliariapy.com', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' },
  { id: 'PY-0188', external_id: null, type: 'Penthouse', operation_type: 'venta', title: 'Penthouse en Carmelitas', description: 'Piso entero con vista panorámica.', neighborhood: 'Carmelitas', city: 'Asunción', zone_slug: 'carmelitas', loc: 'Carmelitas, Asunción', price: 312000, currency: 'USD', bedrooms: 3, bathrooms: 2, sqm: 185, parking: 2, year_built: 2022, floor: 14, image: IMG.v2, status: 'active', source: 'xml_import', boosted: true, agent_name: 'Andrés Martínez', agent_phone: '+595 982 111 222', agent_whatsapp: '595982111222', agent_email: 'andres@inmobiliariapy.com', agent_photo: IMG.agent2, agent_title: 'Vendedor · 4.7★' },
  { id: 'PY-0317', external_id: null, type: 'Casa', operation_type: 'venta', title: 'Casa minimalista con piscina', description: 'Diseño contemporáneo con piscina.', neighborhood: 'Trinidad', city: 'Asunción', zone_slug: 'trinidad', loc: 'Trinidad, Asunción', price: 268000, currency: 'USD', bedrooms: 4, bathrooms: 3, sqm: 240, parking: 2, year_built: 2021, image: IMG.v3, status: 'active', source: 'direct', agent_name: 'María José Benítez', agent_whatsapp: '595981234567', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' },
  { id: 'PY-0402', external_id: null, type: 'Apartamento', operation_type: 'alquiler', title: 'Loft urbano frente al Costanera', description: 'Loft urbano con vista al río.', neighborhood: 'Centro', city: 'Asunción', zone_slug: 'trinidad', loc: 'Centro, Asunción', price: 1800, currency: 'USD', bedrooms: 2, bathrooms: 2, sqm: 120, parking: 1, year_built: 2024, floor: 8, image: IMG.v4, status: 'active', source: 'direct', agent_name: 'María José Benítez', agent_whatsapp: '595981234567', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' },
  { id: 'PY-0099', external_id: 'partner-0099', type: 'Casa', operation_type: 'venta', title: 'Casa de campo en San Bernardino', description: 'Casa de campo con quincho y parque.', neighborhood: 'San Bernardino', city: 'San Bernardino', zone_slug: 'san-bernardino', loc: 'San Bernardino', price: 425000, currency: 'USD', bedrooms: 5, bathrooms: 4, sqm: 410, parking: 4, year_built: 2020, image: IMG.v5, status: 'active', source: 'api_import', boosted: true, agent_name: 'Andrés Martínez', agent_whatsapp: '595982111222', agent_photo: IMG.agent2, agent_title: 'Vendedor · 4.7★' },
  { id: 'PY-0512', external_id: null, type: 'Apartamento', operation_type: 'alquiler', title: 'Studio frente al río Paraguay', description: 'Studio premium con vista panorámica.', neighborhood: 'Costanera', city: 'Asunción', zone_slug: 'carmelitas', loc: 'Costanera, Asunción', price: 950, currency: 'USD', bedrooms: 1, bathrooms: 1, sqm: 75, parking: 1, year_built: 2024, floor: 22, image: IMG.v6, status: 'active', source: 'direct', agent_name: 'María José Benítez', agent_whatsapp: '595981234567', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' },
  { id: 'PY-0227', external_id: null, type: 'Casa', operation_type: 'venta', title: 'Villa contemporánea con cancha', description: 'Villa en Luque con cancha de tenis.', neighborhood: 'Luque', city: 'Luque', zone_slug: 'luque', loc: 'Luque, Central', price: 520000, currency: 'USD', bedrooms: 5, bathrooms: 5, sqm: 480, parking: 3, year_built: 2023, image: IMG.v7, status: 'active', source: 'direct', agent_name: 'Andrés Martínez', agent_whatsapp: '595982111222', agent_photo: IMG.agent2, agent_title: 'Vendedor · 4.7★' },
  { id: 'PY-0364', external_id: null, type: 'Apartamento', operation_type: 'venta', title: 'Dúplex en Las Mercedes', description: 'Apartamento dúplex amoblado.', neighborhood: 'Las Mercedes', city: 'Asunción', zone_slug: 'carmelitas', loc: 'Las Mercedes, Asunción', price: 358000, currency: 'USD', bedrooms: 3, bathrooms: 3, sqm: 210, parking: 2, year_built: 2022, floor: 6, image: IMG.v8, status: 'active', source: 'direct', agent_name: 'María José Benítez', agent_whatsapp: '595981234567', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' },
  { id: 'PY-0451', external_id: 'remax-0451', type: 'Casa', operation_type: 'venta', title: 'Casa tropical en Encarnación', description: 'Casa con jardín tropical.', neighborhood: 'Encarnación', city: 'Encarnación', zone_slug: 'encarnacion', loc: 'Encarnación, Itapúa', price: 295000, currency: 'USD', bedrooms: 4, bathrooms: 3, sqm: 280, parking: 2, year_built: 2021, image: IMG.v9, status: 'active', source: 'xml_import', agent_name: 'Andrés Martínez', agent_whatsapp: '595982111222', agent_photo: IMG.agent2, agent_title: 'Vendedor · 4.7★' },
  { id: 'PY-0573', external_id: null, type: 'Casa', operation_type: 'venta', title: 'Casa frente al lago en Ypacaraí', description: 'Casa premium con muelle privado.', neighborhood: 'Ypacaraí', city: 'Ypacaraí', zone_slug: 'san-bernardino', loc: 'Ypacaraí, Central', price: 612000, currency: 'USD', bedrooms: 5, bathrooms: 4, sqm: 520, parking: 4, year_built: 2024, image: IMG.v10, status: 'active', source: 'direct', agent_name: 'María José Benítez', agent_whatsapp: '595981234567', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' },
  { id: 'PY-0118', external_id: null, type: 'Local', operation_type: 'alquiler', title: 'Local comercial en CDE', description: 'Local sobre avenida principal.', neighborhood: 'Ciudad del Este', city: 'Ciudad del Este', zone_slug: 'ciudad-del-este', loc: 'Ciudad del Este, Alto Paraná', price: 2400, currency: 'USD', bedrooms: 0, bathrooms: 1, sqm: 95, parking: 0, year_built: 2020, image: IMG.v11, status: 'active', source: 'direct', agent_name: 'Andrés Martínez', agent_whatsapp: '595982111222', agent_photo: IMG.agent2, agent_title: 'Vendedor · 4.7★' },
  { id: 'PY-0625', external_id: null, type: 'Apartamento', operation_type: 'venta', title: 'Apartamento con vista panorámica', description: 'Apartamento con vista 360°.', neighborhood: 'Recoleta', city: 'Asunción', zone_slug: 'villa-morra', loc: 'Recoleta, Asunción', price: 240000, currency: 'USD', bedrooms: 2, bathrooms: 2, sqm: 130, parking: 2, year_built: 2023, floor: 18, image: IMG.v12, status: 'active', source: 'direct', agent_name: 'María José Benítez', agent_whatsapp: '595981234567', agent_photo: IMG.agent, agent_title: 'Vendedora · 4.9★' }
];

// Compat fields: surface .img, .priceN, .beds, .baths, .m2, .price (formatted string)
function formatPrice(p) {
  if (p.currency === 'PYG') return `Gs ${(p.price / 1000).toLocaleString('es-PY')}M`;
  return `USD ${p.price.toLocaleString('es-PY')}`;
}
PROPERTIES.forEach(p => {
  p.img = p.image;
  p.priceN = p.price;
  p.beds = p.bedrooms;
  p.baths = p.bathrooms;
  p.m2 = p.sqm;
  const formatted = formatPrice(p);
  p.priceFormatted = formatted;
  // Replace numeric price with formatted string where consumed
  p.price = formatted;
});

// ----- Property card component -----
function PropertyCard({ p, size = 'normal' }) {
  return (
    <article className={`prop-card ${size === 'large' ? 'large' : ''}`}>
      <div className="img-wrap">
        <img src={p.img} alt={p.title} />
        <div className="img-grain" />
        <div className="tag">{p.type}</div>
        {p.boosted && <div className="boost-tag">★ DESTACADO</div>}
        {p.operation_type === 'alquiler' && <div className="op-tag">ALQUILER</div>}
        <div className="id-tag">{p.id}</div>
      </div>
      <div className="body">
        <div className="type">{p.type} · {p.sqm} m²</div>
        <h3 className="title">{p.title}</h3>
        <div className="loc">{p.loc}</div>
        <div className="price-row">
          <div className="price">{p.priceFormatted}{p.operation_type === 'alquiler' && <span className="permo">/mes</span>}</div>
          <div className="specs">
            {p.bedrooms > 0 && <span>{p.bedrooms} dorm</span>}
            <span>{p.bathrooms} baños</span>
            <span>{p.sqm} m²</span>
          </div>
        </div>
      </div>
      <div className="reveal">Ver propiedad →</div>
    </article>
  );
}

Object.assign(window, { IMG, PROPERTIES, ZONES, PROPERTY_TYPES, OPERATION_TYPES, CURRENCIES, PropertyCard, formatPrice });
