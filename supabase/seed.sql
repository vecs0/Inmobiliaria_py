-- InmobiliariaPY - Seed de datos iniciales
--
-- Se aplica con `supabase db reset` SOBRE el esquema de `supabase/migrations/`
-- (baseline `20260101000000_baseline_missing.sql`). NO ejecutar después de
-- `supabase/legacy/schema.sql`: ese SQL es histórico y no se aplica.
--
-- Idempotente y determinista: los ids son UUID literales válidos y cada INSERT
-- usa `ON CONFLICT (id) DO NOTHING`, así el seed puede re-ejecutarse sin fallar.
--
-- Se ejecuta PRIMERO y siembra los 3 agentes de referencia públicos (`agents`).
-- La demo del modelo canónico (`listings` + `property_entities` +
-- `seller_profiles`) va después, en `supabase/seeds/demo.sql`, que corre con la
-- guardia de entorno local (ver `docs/demo-local.md`).

-- ============================================
-- AGENTS
-- ============================================
INSERT INTO agents (id, name, phone, whatsapp, email, photo, title) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Lic. Carolina Mendez',
    '+595 981 123 456',
    '595981123456',
    'carolina@inmobiliariapy.com',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    'Gerente de Propiedades'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Dr. Rodrigo Villalba',
    '+595 982 234 567',
    '595982234567',
    'rodrigo@inmobiliariapy.com',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    'Asesor Senior'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Arq. Valentina Torres',
    '+595 983 345 678',
    '595983345678',
    'valentina@inmobiliariapy.com',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    'Directora Comercial'
  )
ON CONFLICT (id) DO NOTHING;
