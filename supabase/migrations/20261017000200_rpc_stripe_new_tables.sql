-- =====================================================================
-- RPCs atómicas, idempotencia Stripe y tablas nuevas que usa el código
-- InmobiliariaPY V3 · 2026-10-17
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. stripe_events — idempotencia de webhooks (solo service_role)
--    Uso: INSERT event_id al inicio del webhook; si viola PK → ya procesado.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id    text PRIMARY KEY,
  type        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas: anon/authenticated no ven nada; service_role bypassa RLS.
REVOKE ALL ON public.stripe_events FROM anon, authenticated;

-- ---------------------------------------------------------------
-- 2. API keys — contador atómico
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_api_key_usage(p_key_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  UPDATE public.api_keys
  SET requests_today = requests_today + 1,
      requests_total = requests_total + 1,
      last_used_at   = now()
  WHERE id = p_key_id AND active = true
  RETURNING requests_today;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_api_key_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_api_key_usage(uuid) TO service_role;

-- reset diario (ya existía; solo cron con service_role)
CREATE OR REPLACE FUNCTION public.reset_api_key_daily_counters()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  UPDATE public.api_keys SET requests_today = 0 WHERE requests_today <> 0;
$$;
REVOKE EXECUTE ON FUNCTION public.reset_api_key_daily_counters() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.reset_api_key_daily_counters() TO service_role;

-- ---------------------------------------------------------------
-- 3. expire_property_boosts — expira boosts y apaga listings.featured
--    si ya no queda ningún boost activo vigente para esa publicación.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_property_boosts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  WITH expired AS (
    UPDATE public.property_boosts
    SET status = 'expired'
    WHERE status = 'active' AND expires_at < now()
    RETURNING property_id
  )
  UPDATE public.listings l
  SET featured = false
  WHERE l.featured = true
    AND l.id::text IN (SELECT property_id FROM expired)
    AND NOT EXISTS (
      SELECT 1 FROM public.property_boosts b
      WHERE b.property_id = l.id::text
        AND b.status = 'active'
        AND b.expires_at >= now()
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.expire_property_boosts() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.expire_property_boosts() TO service_role;

-- ---------------------------------------------------------------
-- 4. search_history — historial del comprador
--    Columnas según src/app/comprador/{recientes,recomendadas}/page.tsx:
--    user_id, action ('view' | 'search'), property_id, search_query, created_at.
--    property_id → listings(id) (modelo canónico; permite embed properties_full).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action        text NOT NULL DEFAULT 'view' CHECK (action IN ('view', 'search')),
  property_id   uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  search_query  text,
  filters       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user_created
  ON public.search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_property_id
  ON public.search_history (property_id);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sh_select_own" ON public.search_history;
DROP POLICY IF EXISTS "sh_insert_own" ON public.search_history;
DROP POLICY IF EXISTS "sh_delete_own" ON public.search_history;
CREATE POLICY "sh_select_own" ON public.search_history
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "sh_insert_own" ON public.search_history
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sh_delete_own" ON public.search_history
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------
-- 5. import_feeds — feeds XML/CSV por vendedor (cron sync-feeds)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_feeds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id  uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  name               text,
  url                text NOT NULL,
  format             text NOT NULL DEFAULT 'xml' CHECK (format IN ('xml', 'csv')),
  active             boolean NOT NULL DEFAULT true,
  frequency_minutes  integer NOT NULL DEFAULT 1440,
  last_synced_at     timestamptz,
  last_status        text,
  last_error         text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_profile_id, url)
);
CREATE INDEX IF NOT EXISTS idx_import_feeds_active ON public.import_feeds (active) WHERE active = true;

DROP TRIGGER IF EXISTS update_import_feeds_updated_at ON public.import_feeds;
CREATE TRIGGER update_import_feeds_updated_at
  BEFORE UPDATE ON public.import_feeds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.import_feeds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "if_owner_all" ON public.import_feeds;
CREATE POLICY "if_owner_all" ON public.import_feeds
  FOR ALL TO authenticated
  USING (seller_profile_id IN (SELECT public.my_seller_profile_ids()))
  WITH CHECK (seller_profile_id IN (SELECT public.my_seller_profile_ids()));
-- last_* los escribe el cron con service_role (bypassa RLS).
