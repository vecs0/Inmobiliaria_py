-- ============================================================
-- Fase 6-D: Infraestructura B2B — API Keys
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  key_prefix      text NOT NULL,            -- primeros 8 chars visibles (ej: "impy_liv")
  key_hash        text NOT NULL UNIQUE,     -- SHA-256 del key completo
  active          boolean NOT NULL DEFAULT true,
  requests_today  integer NOT NULL DEFAULT 0,
  requests_total  bigint NOT NULL DEFAULT 0,
  last_used_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS api_keys_seller_id_idx  ON api_keys (seller_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx   ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS api_keys_active_idx     ON api_keys (active) WHERE active = true;

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ak_select_own" ON api_keys;
DROP POLICY IF EXISTS "ak_insert_own" ON api_keys;
DROP POLICY IF EXISTS "ak_update_own" ON api_keys;
DROP POLICY IF EXISTS "ak_delete_own" ON api_keys;
DROP POLICY IF EXISTS "ak_service_role" ON api_keys;

CREATE POLICY "ak_select_own" ON api_keys FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "ak_insert_own" ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "ak_update_own" ON api_keys FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "ak_delete_own" ON api_keys FOR DELETE
  USING (auth.uid() = seller_id);

-- service_role puede leer y actualizar contadores (sin RLS)
CREATE POLICY "ak_service_role" ON api_keys FOR ALL
  USING (auth.role() = 'service_role');

-- Reset diario de requests_today (llamar desde cron)
CREATE OR REPLACE FUNCTION reset_api_key_daily_counters()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE api_keys SET requests_today = 0;
$$;
