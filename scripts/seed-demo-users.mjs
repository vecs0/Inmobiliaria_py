/**
 * Crea 3 usuarios demo + 5 propiedades en Supabase.
 * Requiere SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local
 *
 * Uso: node --env-file=.env.local scripts/seed-demo-users.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'Demo2026!';

const USERS = [
  {
    email: 'comprador@demo.inmobiliaripy.py',
    role: 'user',
    full_name: 'Carolina Compradora',
    seller: null,
  },
  {
    email: 'vendedor.particular@demo.inmobiliaripy.py',
    role: 'seller',
    full_name: 'Juan Particular',
    seller: { seller_type: 'particular', max_properties: 5 },
  },
  {
    email: 'empresa@demo.inmobiliaripy.py',
    role: 'seller_empresa',
    full_name: 'Andrés Martínez',
    seller: {
      seller_type: 'empresa',
      company_name: 'Inmobiliaria del Este S.A.',
      ruc: '80012345-6',
      max_properties: 50,
      subscription_plan: 'pro',
    },
  },
];

const PROPERTIES = [
  {
    external_id: 'PY-0241',
    type: 'Casa',
    title: 'Residencia con jardín en Villa Morra',
    neighborhood: 'Villa Morra',
    city: 'Asunción',
    price: 485000,
    bedrooms: 4,
    bathrooms: 3,
    sqm: 328,
    operation_type: 'venta',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    status: 'active',
  },
  {
    external_id: 'PY-0188',
    type: 'Penthouse',
    title: 'Penthouse en Carmelitas',
    neighborhood: 'Carmelitas',
    city: 'Asunción',
    price: 312000,
    bedrooms: 3,
    bathrooms: 2,
    sqm: 185,
    operation_type: 'venta',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    status: 'active',
  },
  {
    external_id: 'PY-0317',
    type: 'Casa',
    title: 'Casa minimalista con piscina',
    neighborhood: 'Trinidad',
    city: 'Asunción',
    price: 268000,
    bedrooms: 4,
    bathrooms: 3,
    sqm: 240,
    operation_type: 'venta',
    featured: false,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    status: 'active',
  },
  {
    external_id: 'PY-0402',
    type: 'Apartamento',
    title: 'Loft urbano frente al Costanera',
    neighborhood: 'Centro',
    city: 'Asunción',
    price: 1800,
    bedrooms: 2,
    bathrooms: 2,
    sqm: 120,
    operation_type: 'alquiler',
    featured: false,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
    status: 'pending',
  },
  {
    external_id: 'PY-0099',
    type: 'Casa',
    title: 'Casa de campo en San Bernardino',
    neighborhood: 'San Bernardino',
    city: 'San Bernardino',
    price: 425000,
    bedrooms: 5,
    bathrooms: 4,
    sqm: 410,
    operation_type: 'venta',
    featured: true,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
    status: 'paused',
  },
];

async function ensureUser(def) {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === def.email);
  if (existing) {
    console.log(`Usuario ya existe: ${def.email}`);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: def.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: def.full_name, role: def.role },
  });
  if (error) throw error;
  console.log(`Usuario creado: ${def.email}`);
  return data.user.id;
}

async function ensureSeller(userId, seller) {
  if (!seller) return null;
  const { data: existing } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('seller_profiles')
    .insert({
      user_id: userId,
      seller_type: seller.seller_type,
      full_name: USERS.find((u) => u.seller === seller)?.full_name,
      company_name: seller.company_name ?? null,
      ruc: seller.ruc ?? null,
      max_properties: seller.max_properties ?? 5,
      subscription_plan: seller.subscription_plan ?? 'trial',
      subscription_status: 'active',
      properties_count: 0,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureListing(prop, sellerProfileId) {
  const { data: existing } = await supabase
    .from('listings')
    .select('id')
    .eq('external_id', prop.external_id)
    .maybeSingle();
  if (existing) {
    console.log(`  Listing ya existe: ${prop.external_id}`);
    return;
  }

  const { data: entity, error: entityErr } = await supabase
    .from('property_entities')
    .insert({
      city: prop.city,
      neighborhood: prop.neighborhood,
      type: prop.type,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      sqm: prop.sqm,
      parking: 2,
    })
    .select('id')
    .single();
  if (entityErr) throw entityErr;

  const { error: listingErr } = await supabase.from('listings').insert({
    entity_id: entity.id,
    seller_profile_id: sellerProfileId,
    external_id: prop.external_id,
    title: prop.title,
    description: `${prop.title} en ${prop.neighborhood}, ${prop.city}. Propiedad de demostración.`,
    price: prop.price,
    currency: 'USD',
    operation_type: prop.operation_type,
    image: prop.image,
    images: [prop.image],
    amenities: ['Piscina', 'Garage', 'Jardín'],
    featured: prop.featured,
    status: prop.status,
    source: 'direct',
  });
  if (listingErr) throw listingErr;
  console.log(`  Listing creado: ${prop.external_id}`);
}

async function main() {
  console.log('Sembrando usuarios demo...\n');
  const empresaUser = USERS[2];
  const empresaId = await ensureUser(empresaUser);
  const empresaSellerId = await ensureSeller(empresaId, empresaUser.seller);

  for (const u of USERS.slice(0, 2)) {
    const uid = await ensureUser(u);
    await ensureSeller(uid, u.seller);
  }

  if (!empresaSellerId) {
    console.error('No se pudo obtener seller_profile de empresa');
    process.exit(1);
  }

  console.log('\nSembrando 5 propiedades (empresa)...');
  for (const p of PROPERTIES) {
    await ensureListing(p, empresaSellerId);
  }

  console.log('\n--- Credenciales demo (contraseña: Demo2026!) ---');
  for (const u of USERS) {
    console.log(`  ${u.email} → ${u.seller ? 'panel /vendedor' : 'espacio /comprador'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
