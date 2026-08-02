-- ============================================================
-- Fase 6-A++: Alertas de Oportunidad — Búsquedas Guardadas
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  filters       jsonb NOT NULL DEFAULT '{}',
  -- filters shape: { ciudad?: string, tipo?: string, precioMin?: number, precioMax?: number, bedrooms?: number }
  active        boolean NOT NULL DEFAULT true,
  last_notified_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS saved_searches_active_idx  ON saved_searches(active) WHERE active = true;

-- Updated_at automático
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_searches_updated_at ON saved_searches;
CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_saved_searches_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven sus propias búsquedas
CREATE POLICY "saved_searches_select_own" ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

-- Usuarios solo insertan con su propio user_id
CREATE POLICY "saved_searches_insert_own" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios solo actualizan las suyas
CREATE POLICY "saved_searches_update_own" ON saved_searches
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuarios solo eliminan las suyas
CREATE POLICY "saved_searches_delete_own" ON saved_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Service role puede leer todo (para el cron de notificaciones)
CREATE POLICY "saved_searches_service_select" ON saved_searches
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "saved_searches_service_update" ON saved_searches
  FOR UPDATE USING (auth.role() = 'service_role');
