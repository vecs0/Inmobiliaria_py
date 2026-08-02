-- ============================================================
-- Fase 6-B: Analítica SaaS — Vistas de Propiedades
-- ============================================================

CREATE TABLE IF NOT EXISTS property_views (
  id          bigserial PRIMARY KEY,
  property_id text NOT NULL,
  seller_id   uuid,  -- desnormalizado para queries rápidas de analítica
  ip_hash     text,  -- SHA-256 del IP para deduplicar sin almacenar PII
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índices para queries de analítica
CREATE INDEX IF NOT EXISTS pv_property_id_idx   ON property_views(property_id);
CREATE INDEX IF NOT EXISTS pv_seller_id_idx     ON property_views(seller_id);
CREATE INDEX IF NOT EXISTS pv_created_at_idx    ON property_views(created_at DESC);
CREATE INDEX IF NOT EXISTS pv_property_date_idx ON property_views(property_id, created_at DESC);

-- RLS: vendedores solo ven vistas de sus propiedades
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Inserción pública (cualquier visita puede registrar una vista via API route)
CREATE POLICY "pv_insert_anon" ON property_views
  FOR INSERT WITH CHECK (true);

-- Lectura: solo el vendedor dueño o service_role
CREATE POLICY "pv_select_own" ON property_views
  FOR SELECT USING (
    auth.uid() = seller_id OR
    auth.role() = 'service_role'
  );

-- Vista materializada para dashboard (refresh cada hora via cron)
-- Por ahora usamos queries directas optimizadas con índices
