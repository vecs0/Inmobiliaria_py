-- ============================================================
-- Fase 6-B+: Sistema de Destacados / Ads
-- ============================================================

CREATE TABLE IF NOT EXISTS property_boosts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           text NOT NULL,
  seller_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key              text NOT NULL,
  price_usd             numeric(10,2) NOT NULL,
  status                text NOT NULL DEFAULT 'pending',
  stripe_session_id     text,
  stripe_payment_intent text,
  starts_at             timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pb_seller_id_idx   ON property_boosts(seller_id);
CREATE INDEX IF NOT EXISTS pb_property_id_idx ON property_boosts(property_id);
CREATE INDEX IF NOT EXISTS pb_status_idx      ON property_boosts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS pb_expires_at_idx  ON property_boosts(expires_at DESC);

CREATE OR REPLACE FUNCTION expire_property_boosts()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE property_boosts
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
END;
$$;

ALTER TABLE property_boosts ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen (idempotente)
DROP POLICY IF EXISTS "pb_select_own"     ON property_boosts;
DROP POLICY IF EXISTS "pb_insert_service" ON property_boosts;
DROP POLICY IF EXISTS "pb_update_service" ON property_boosts;

CREATE POLICY "pb_select_own" ON property_boosts
  FOR SELECT USING (auth.uid() = seller_id OR auth.role() = 'service_role');

CREATE POLICY "pb_insert_service" ON property_boosts
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = seller_id);

CREATE POLICY "pb_update_service" ON property_boosts
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = seller_id);
