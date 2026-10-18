-- InmobiliariaPY - Schema para Supabase
-- Ejecutar en el SQL Editor de Supabase: https://app.supabase.com/project/_/sql

-- ============================================
-- TABLA: agents
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  photo TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: properties
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'PYG')),
  type TEXT NOT NULL CHECK (type IN ('Casa', 'Apartamento', 'Penthouse', 'Terreno', 'Oficina')),
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  sqm INTEGER NOT NULL,
  parking INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  tag TEXT,
  image TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  yearBuilt INTEGER,
  floor INTEGER,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZAR FILTROS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Índice compuesto para filtros combinados comunes
CREATE INDEX IF NOT EXISTS idx_properties_city_type_price ON properties(city, type, price);
CREATE INDEX IF NOT EXISTS idx_properties_featured_city ON properties(featured, city);

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLICÍAS RLS (Row Level Security)
-- ============================================
-- Habilitar RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policies para agents: lectura pública, escritura solo auth
CREATE POLICY "agents_read_public" ON agents
  FOR SELECT USING (true);

CREATE POLICY "agents_write_auth" ON agents
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies para properties: lectura pública, escritura solo auth
CREATE POLICY "properties_read_public" ON properties
  FOR SELECT USING (true);

CREATE POLICY "properties_write_auth" ON properties
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- VISTA: properties_with_agent (opcional, para queries más simples)
-- ============================================
CREATE OR REPLACE VIEW properties_with_agent AS
SELECT
  p.*,
  a.name AS agent_name,
  a.phone AS agent_phone,
  a.whatsapp AS agent_whatsapp,
  a.email AS agent_email,
  a.photo AS agent_photo,
  a.title AS agent_title
FROM properties p
LEFT JOIN agents a ON p.agent_id = a.id;

-- ============================================
-- TABLA: leads (Consultas de clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Solo los agentes/admin pueden ver los leads (auth)
CREATE POLICY "leads_read_auth" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Cualquiera puede insertar un lead (público) pero con restricciones de seguridad
CREATE POLICY "public_insert_leads" ON leads
  FOR INSERT WITH CHECK (
    status = 'pending' AND
    name IS NOT NULL AND
    email IS NOT NULL AND
    length(email) > 5
  );

-- ============================================
-- SQL DE LIMPIEZA (OPCIONAL)
-- ============================================
-- Borrar datos antiguos con IDs de texto si se desea reiniciar:
-- DELETE FROM leads;
-- DELETE FROM properties WHERE id::text NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
-- DELETE FROM agents WHERE id::text NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- ============================================
-- TABLA: seller_profiles (vendedores: particulares y empresas)
-- ============================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_type VARCHAR(20) NOT NULL CHECK (seller_type IN ('particular', 'empresa')),
  full_name TEXT,
  phone TEXT,
  cedula TEXT,
  company_name TEXT,
  ruc TEXT,
  ruc_verified BOOLEAN DEFAULT FALSE,
  has_website BOOLEAN DEFAULT FALSE,
  website_url TEXT,
  subscription_plan VARCHAR(20) DEFAULT 'trial',
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  max_properties INTEGER DEFAULT 0,
  properties_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_seller_type ON seller_profiles(seller_type);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_profiles_read_own" ON seller_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "seller_profiles_insert_own" ON seller_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "seller_profiles_update_own" ON seller_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE TRIGGER update_seller_profiles_updated_at
  BEFORE UPDATE ON seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
