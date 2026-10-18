-- =====================================================================
-- SECURITY HARDENING — InmobiliariaPY V3 · 2026-10-17
-- Corrige hallazgos CRÍTICOS/ALTOS de la auditoría:
--   1. handle_new_user copiaba role del metadata → cualquiera se registraba admin
--   2. "Users can update own profile" permitía cambiar profiles.role
--   3. property_boosts INSERT/UPDATE por el vendedor → boosts gratis;
--      listings.featured editable por el vendedor
--   4. seller_profiles: el vendedor podía cambiar plan/límites/verificación
--   5. Políticas faltantes/excesivas: property_entities, leads, agents,
--      payments, favorites, api_keys
--   + columnas que el código usa y no existían (leads.*, seller_profiles.max_agents)
--   + FKs de leads/favorites movidos de properties (legacy) → listings
--   + vistas con security_invoker (respetan RLS de listings)
--
-- Idempotente: DROP ... IF EXISTS antes de CREATE, bloques condicionales.
-- Convención de privilegio:
--   is_privileged_session() = current_user NOT IN ('anon','authenticated')
--   → verdadero para service_role, postgres y funciones SECURITY DEFINER.
-- =====================================================================

-- ---------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_privileged_session()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT current_user NOT IN ('anon', 'authenticated');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
-- anon necesita EXECUTE: se evalúa dentro de políticas SELECT públicas (devuelve false)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Id de los seller_profiles del usuario actual (evita subconsultas repetidas en RLS)
CREATE OR REPLACE FUNCTION public.my_seller_profile_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT id FROM public.seller_profiles WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.my_seller_profile_ids() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.my_seller_profile_ids() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- 1. handle_new_user — whitelist de roles desde metadata
--    LegacyAuthClient envía role ∈ {user, seller, seller_empresa}.
--    Nunca admin/agent desde el cliente. Default 'user'.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role text := lower(trim(COALESCE(NEW.raw_user_meta_data->>'role', 'user')));
BEGIN
  IF v_role NOT IN ('user', 'seller', 'seller_empresa') THEN
    v_role := 'user';
  END IF;

  -- Robustez: si el valor no existe en el enum vivo, caer a 'user'
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t      ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = v_role
  ) THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'full_name',
    v_role::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- 2. profiles — el usuario no puede cambiar su rol (ni plan_id si existe)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profiles_privileged_cols()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF public.is_privileged_session() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NULL OR NEW.role::text NOT IN ('user', 'seller', 'seller_empresa') THEN
      NEW.role := 'user';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'No autorizado: no se puede modificar el id del perfil' USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'No autorizado: no se puede modificar el rol' USING ERRCODE = '42501';
  END IF;

  -- plan_id puede no existir en el esquema vivo → comparación genérica vía jsonb
  IF (to_jsonb(NEW) ? 'plan_id') AND (to_jsonb(NEW)->'plan_id') IS DISTINCT FROM (to_jsonb(OLD)->'plan_id') THEN
    RAISE EXCEPTION 'No autorizado: no se puede modificar el plan' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profiles_privileged_cols ON public.profiles;
CREATE TRIGGER trg_guard_profiles_privileged_cols
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_privileged_cols();

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- ---------------------------------------------------------------
-- 3a. listings — `featured` (y featured_until si existe) solo por service_role
--     (webhook de Stripe / cron). Cambios del vendedor se revierten en silencio
--     para no romper formularios que reenvían la fila completa.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_listings_featured()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF public.is_privileged_session() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.featured := false;
    IF to_jsonb(NEW) ? 'featured_until' THEN
      NEW := jsonb_populate_record(NEW, jsonb_build_object('featured_until', NULL));
    END IF;
  ELSE
    NEW.featured := OLD.featured;
    IF to_jsonb(NEW) ? 'featured_until' THEN
      NEW := jsonb_populate_record(NEW, jsonb_build_object('featured_until', to_jsonb(OLD)->'featured_until'));
    END IF;
    -- El dueño no puede transferir la publicación a otro seller_profile
    NEW.seller_profile_id := OLD.seller_profile_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_listings_featured ON public.listings;
CREATE TRIGGER trg_guard_listings_featured
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_listings_featured();

-- Políticas canónicas de listings (antes vivían en SQL suelto fix_advisors.sql)
DROP POLICY IF EXISTS "Public Read Listings"        ON public.listings;
DROP POLICY IF EXISTS "Sellers Manage Own Listings" ON public.listings;
DROP POLICY IF EXISTS "listings_select_policy"      ON public.listings;
DROP POLICY IF EXISTS "listings_insert_policy"      ON public.listings;
DROP POLICY IF EXISTS "listings_update_policy"      ON public.listings;
DROP POLICY IF EXISTS "listings_delete_policy"      ON public.listings;

CREATE POLICY "listings_select_policy" ON public.listings
  FOR SELECT USING (
    status = 'active'
    OR seller_profile_id IN (SELECT public.my_seller_profile_ids())
    OR public.is_admin()
  );
CREATE POLICY "listings_insert_policy" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (seller_profile_id IN (SELECT public.my_seller_profile_ids()));
CREATE POLICY "listings_update_policy" ON public.listings
  FOR UPDATE TO authenticated
  USING (seller_profile_id IN (SELECT public.my_seller_profile_ids()))
  WITH CHECK (seller_profile_id IN (SELECT public.my_seller_profile_ids()));
CREATE POLICY "listings_delete_policy" ON public.listings
  FOR DELETE TO authenticated
  USING (seller_profile_id IN (SELECT public.my_seller_profile_ids()) OR public.is_admin());

-- ---------------------------------------------------------------
-- 3b. property_boosts — el vendedor solo crea boosts 'pending' de SUS
--     publicaciones; solo puede adjuntar stripe_session_id mientras esté
--     pending. Activar/expirar = service_role (webhook / cron).
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "pb_select_own"         ON public.property_boosts;
DROP POLICY IF EXISTS "pb_insert_service"     ON public.property_boosts;
DROP POLICY IF EXISTS "pb_update_service"     ON public.property_boosts;
DROP POLICY IF EXISTS "pb_insert_own_pending" ON public.property_boosts;
DROP POLICY IF EXISTS "pb_update_own_pending" ON public.property_boosts;

CREATE POLICY "pb_select_own" ON public.property_boosts
  FOR SELECT USING (seller_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "pb_insert_own_pending" ON public.property_boosts
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND status = 'pending'
    AND starts_at IS NULL
    AND expires_at IS NULL
    AND stripe_payment_intent IS NULL
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id::text = property_boosts.property_id
        AND l.seller_profile_id IN (SELECT public.my_seller_profile_ids())
    )
  );

CREATE POLICY "pb_update_own_pending" ON public.property_boosts
  FOR UPDATE TO authenticated
  USING (seller_id = (SELECT auth.uid()) AND status = 'pending')
  WITH CHECK (seller_id = (SELECT auth.uid()) AND status = 'pending');

CREATE OR REPLACE FUNCTION public.guard_property_boosts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_session text;
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status                := 'pending';
    NEW.starts_at             := NULL;
    NEW.expires_at            := NULL;
    NEW.stripe_payment_intent := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE por el dueño: solo se acepta stripe_session_id
  v_session := NEW.stripe_session_id;
  NEW := OLD;
  NEW.stripe_session_id := v_session;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_property_boosts ON public.property_boosts;
CREATE TRIGGER trg_guard_property_boosts
  BEFORE INSERT OR UPDATE ON public.property_boosts
  FOR EACH ROW EXECUTE FUNCTION public.guard_property_boosts();

-- ---------------------------------------------------------------
-- 4. seller_profiles — columnas de facturación/límites/verificación
--    solo modificables por service_role/admin
-- ---------------------------------------------------------------
ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS max_agents integer DEFAULT 0;

CREATE OR REPLACE FUNCTION public.guard_seller_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role text;
BEGIN
  IF public.is_privileged_session() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- seller_type coherente con el rol del perfil (definido al registrarse)
    SELECT role::text INTO v_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_role = 'seller_empresa' THEN
      NEW.seller_type := 'empresa';
    ELSE
      NEW.seller_type := 'particular';
    END IF;

    NEW.ruc_verified           := false;
    NEW.subscription_plan      := 'trial';
    NEW.subscription_status    := 'inactive';
    NEW.max_properties         := 5;
    NEW.max_agents             := CASE WHEN NEW.seller_type = 'empresa' THEN 3 ELSE 0 END;
    NEW.properties_count       := 0;
    NEW.stripe_subscription_id := NULL;
    NEW.stripe_price_id        := NULL;
    NEW.trial_ends_at          := LEAST(COALESCE(NEW.trial_ends_at, now() + interval '7 days'), now() + interval '7 days');
    RETURN NEW;
  END IF;

  -- UPDATE: revertir silenciosamente columnas protegidas
  NEW.user_id                := OLD.user_id;
  NEW.seller_type            := OLD.seller_type;
  NEW.ruc_verified           := OLD.ruc_verified;
  NEW.subscription_plan      := OLD.subscription_plan;
  NEW.subscription_status    := OLD.subscription_status;
  NEW.max_properties         := OLD.max_properties;
  NEW.max_agents             := OLD.max_agents;
  NEW.properties_count       := OLD.properties_count;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.stripe_price_id        := OLD.stripe_price_id;
  NEW.trial_ends_at          := OLD.trial_ends_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_seller_profiles ON public.seller_profiles;
CREATE TRIGGER trg_guard_seller_profiles
  BEFORE INSERT OR UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_seller_profiles();

-- Un seller_profile por usuario (si hay duplicados en la viva, se avisa y se sigue)
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_seller_profiles_user_id ON public.seller_profiles (user_id);
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'seller_profiles tiene user_id duplicados: índice único NO creado (limpiar manualmente)';
END $$;

DROP POLICY IF EXISTS "Sellers CRUD Own Profile"   ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_read_own"   ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_insert_own" ON public.seller_profiles;
DROP POLICY IF EXISTS "seller_profiles_update_own" ON public.seller_profiles;

CREATE POLICY "Sellers CRUD Own Profile" ON public.seller_profiles
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- properties_count: las funciones pasan a SECURITY DEFINER (el guard bloquea
-- al usuario) y verifican que el perfil sea del llamador.
CREATE OR REPLACE FUNCTION public.increment_properties_count(profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.seller_profiles
  SET properties_count = COALESCE(properties_count, 0) + 1
  WHERE id = profile_id
    AND (user_id = auth.uid() OR auth.role() = 'service_role');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_properties_count(profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.seller_profiles
  SET properties_count = GREATEST(COALESCE(properties_count, 0) - 1, 0)
  WHERE id = profile_id
    AND (user_id = auth.uid() OR auth.role() = 'service_role');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_properties_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_properties_count(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_properties_count(uuid) TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.decrement_properties_count(uuid) TO authenticated, service_role;

-- Versión trigger (DELETE en listings)
CREATE OR REPLACE FUNCTION public.decrement_properties_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.seller_profiles
  SET properties_count = GREATEST(0, COALESCE(properties_count, 0) - 1)
  WHERE id = OLD.seller_profile_id;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.decrement_properties_count() FROM PUBLIC, anon, authenticated;

-- Crear el trigger de DELETE solo si la tabla no tiene ya uno con esa función
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_proc p ON p.oid = tg.tgfoid
    WHERE tg.tgrelid = 'public.listings'::regclass
      AND p.proname = 'decrement_properties_count'
      AND NOT tg.tgisinternal
  ) THEN
    CREATE TRIGGER trg_listings_decrement_count
      AFTER DELETE ON public.listings
      FOR EACH ROW EXECUTE FUNCTION public.decrement_properties_count();
  END IF;
END $$;

-- ---------------------------------------------------------------
-- 5a. property_entities — lectura pública; escritura del vendedor
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Entities"     ON public.property_entities;
DROP POLICY IF EXISTS "pe_insert_seller"         ON public.property_entities;
DROP POLICY IF EXISTS "pe_update_owner"          ON public.property_entities;
DROP POLICY IF EXISTS "pe_delete_owner"          ON public.property_entities;

CREATE POLICY "Public Read Entities" ON public.property_entities
  FOR SELECT USING (true);

-- Cualquier usuario con seller_profile puede crear entidades
CREATE POLICY "pe_insert_seller" ON public.property_entities
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.my_seller_profile_ids()));

-- Editar/borrar: la entidad tiene al menos un listing propio y NINGUNO ajeno
-- (entidades deduplicadas compartidas no pueden ser alteradas por un vendedor)
CREATE POLICY "pe_update_owner" ON public.property_entities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.listings l
            WHERE l.entity_id = property_entities.id
              AND l.seller_profile_id IN (SELECT public.my_seller_profile_ids()))
    AND NOT EXISTS (SELECT 1 FROM public.listings l
            WHERE l.entity_id = property_entities.id
              AND (l.seller_profile_id IS NULL
                   OR l.seller_profile_id NOT IN (SELECT public.my_seller_profile_ids())))
  );

CREATE POLICY "pe_delete_owner" ON public.property_entities
  FOR DELETE TO authenticated
  USING (
    NOT EXISTS (SELECT 1 FROM public.listings l
            WHERE l.entity_id = property_entities.id
              AND (l.seller_profile_id IS NULL
                   OR l.seller_profile_id NOT IN (SELECT public.my_seller_profile_ids())))
    AND EXISTS (SELECT 1 FROM public.my_seller_profile_ids())
  );

-- ---------------------------------------------------------------
-- 5b. leads — INSERT solo service_role (desde /api/contact).
--     El vendedor ve/actualiza leads de sus publicaciones.
-- ---------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS seller_id     uuid,
  ADD COLUMN IF NOT EXISTS buyer_id      uuid,
  ADD COLUMN IF NOT EXISTS score         integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_details jsonb   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_read       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS source        text    DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS assigned_to   uuid;

-- seller_id = auth uid del VENDEDOR (= seller_profiles.user_id), coincide con
-- src/lib/seller/fetch-dashboard.ts. buyer_id = auth uid del comprador (nullable).
-- FKs NOT VALID para no fallar con filas históricas.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_seller_id_fkey') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_buyer_id_fkey') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_assigned_to_fkey') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_seller_id  ON public.leads (seller_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- Repuntar leads.property_id y favorites.property_id: properties (legacy) → listings
DO $$
DECLARE
  v_listings_type text;
  v_col_type      text;
  r record;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO v_listings_type
  FROM pg_attribute a WHERE a.attrelid = 'public.listings'::regclass AND a.attname = 'id';

  FOR r IN SELECT * FROM (VALUES ('leads', 'CASCADE'), ('favorites', 'CASCADE')) AS t(tbl, on_del) LOOP
    SELECT format_type(a.atttypid, a.atttypmod) INTO v_col_type
    FROM pg_attribute a
    WHERE a.attrelid = format('public.%I', r.tbl)::regclass AND a.attname = 'property_id';

    -- Quitar FK hacia properties (legacy)
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.tbl, r.tbl || '_property_id_fkey');

    IF v_col_type = v_listings_type THEN
      EXECUTE format(
        'ALTER TABLE public.%1$I ADD CONSTRAINT %2$I FOREIGN KEY (property_id) REFERENCES public.listings(id) ON DELETE %3$s NOT VALID',
        r.tbl, r.tbl || '_property_id_fkey', r.on_del
      );
    ELSE
      RAISE NOTICE '%.property_id (%) no coincide con listings.id (%): FK no creado', r.tbl, v_col_type, v_listings_type;
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "leads_read_auth"             ON public.leads;
DROP POLICY IF EXISTS "public_insert_leads"         ON public.leads;
DROP POLICY IF EXISTS "leads_read_seller_and_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_update_read_status"    ON public.leads;
DROP POLICY IF EXISTS "sellers_see_own_leads"       ON public.leads;
DROP POLICY IF EXISTS "admins_manage_leads"         ON public.leads;
DROP POLICY IF EXISTS "leads_select_policy"         ON public.leads;
DROP POLICY IF EXISTS "admins_insert_leads"         ON public.leads;
DROP POLICY IF EXISTS "admins_update_leads"         ON public.leads;
DROP POLICY IF EXISTS "admins_delete_leads"         ON public.leads;
DROP POLICY IF EXISTS "leads_update_seller"         ON public.leads;
DROP POLICY IF EXISTS "leads_delete_admin"          ON public.leads;

CREATE POLICY "leads_select_policy" ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR seller_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = leads.property_id
        AND l.seller_profile_id IN (SELECT public.my_seller_profile_ids())
    )
  );

CREATE POLICY "leads_update_seller" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR seller_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = leads.property_id
        AND l.seller_profile_id IN (SELECT public.my_seller_profile_ids())
    )
  );

CREATE POLICY "leads_delete_admin" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_admin());
-- Sin política INSERT: solo service_role (bypassa RLS) inserta leads.

-- El vendedor solo puede tocar status / is_read / assigned_to
CREATE OR REPLACE FUNCTION public.guard_leads_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_status   text;
  v_is_read  boolean;
  v_assigned uuid;
BEGIN
  IF public.is_privileged_session() OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  v_status   := NEW.status;
  v_is_read  := NEW.is_read;
  v_assigned := NEW.assigned_to;
  NEW := OLD;
  NEW.status      := v_status;
  NEW.is_read     := v_is_read;
  NEW.assigned_to := v_assigned;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_leads_update ON public.leads;
CREATE TRIGGER trg_guard_leads_update
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.guard_leads_update();

-- ---------------------------------------------------------------
-- 5c. favorites — CRUD propio
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_own"           ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own"           ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own"           ON public.favorites;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_favorites_user_property ON public.favorites (user_id, property_id);
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'favorites tiene duplicados (user_id, property_id): índice único NO creado';
END $$;

-- ---------------------------------------------------------------
-- 5d. agents — lectura pública; gestión por vendedor EMPRESA que lo invitó
--     (agents.invited_by = seller_profiles.id, ver 20260520101700)
-- ---------------------------------------------------------------
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS invite_token      uuid,
  ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by        uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_agents_invited_by ON public.agents (invited_by);

DROP POLICY IF EXISTS "agents_read_public"    ON public.agents;
DROP POLICY IF EXISTS "agents_write_auth"     ON public.agents;
DROP POLICY IF EXISTS "Public Read Agents"    ON public.agents;
DROP POLICY IF EXISTS "agents_insert_company" ON public.agents;
DROP POLICY IF EXISTS "agents_update_company" ON public.agents;
DROP POLICY IF EXISTS "agents_delete_company" ON public.agents;

CREATE POLICY "Public Read Agents" ON public.agents
  FOR SELECT USING (true);

CREATE POLICY "agents_insert_company" ON public.agents
  FOR INSERT TO authenticated
  WITH CHECK (invited_by IN (
    SELECT sp.id FROM public.seller_profiles sp
    WHERE sp.user_id = (SELECT auth.uid()) AND sp.seller_type = 'empresa'
  ));
CREATE POLICY "agents_update_company" ON public.agents
  FOR UPDATE TO authenticated
  USING (invited_by IN (
    SELECT sp.id FROM public.seller_profiles sp
    WHERE sp.user_id = (SELECT auth.uid()) AND sp.seller_type = 'empresa'
  ))
  WITH CHECK (invited_by IN (
    SELECT sp.id FROM public.seller_profiles sp
    WHERE sp.user_id = (SELECT auth.uid()) AND sp.seller_type = 'empresa'
  ));
CREATE POLICY "agents_delete_company" ON public.agents
  FOR DELETE TO authenticated
  USING (invited_by IN (
    SELECT sp.id FROM public.seller_profiles sp
    WHERE sp.user_id = (SELECT auth.uid()) AND sp.seller_type = 'empresa'
  ));

-- ---------------------------------------------------------------
-- 5e. payments — lectura propia; escritura solo service_role
-- ---------------------------------------------------------------
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_session_id text;

DROP POLICY IF EXISTS "payments_read_own" ON public.payments;
CREATE POLICY "payments_read_own" ON public.payments
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_invoice_id text;

-- Idempotencia de webhooks
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_session_id
  ON public.payments (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_invoice_id
    ON public.payments (stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'payments.stripe_invoice_id duplicado: índice único NO creado';
END $$;

-- saved_searches.last_notified_at (cron notify-alerts) — ya existe en 20260513130000
ALTER TABLE public.saved_searches ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

-- ---------------------------------------------------------------
-- 5f. Catálogos públicos y legacy (antes en SQL suelto)
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "public_read_subscription_plans" ON public.subscription_plans;
CREATE POLICY "public_read_subscription_plans" ON public.subscription_plans
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "properties_read_public"  ON public.properties;
DROP POLICY IF EXISTS "properties_write_auth"   ON public.properties;
DROP POLICY IF EXISTS "Public Read"             ON public.properties;
CREATE POLICY "Public Read" ON public.properties
  FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- 5g. api_keys — el dueño solo cambia name/active; contadores = service
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_api_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_name   text;
  v_active boolean;
BEGIN
  IF public.is_privileged_session() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.requests_today := 0;
    NEW.requests_total := 0;
    NEW.last_used_at   := NULL;
    RETURN NEW;
  END IF;

  v_name   := NEW.name;
  v_active := NEW.active;
  NEW := OLD;
  NEW.name   := v_name;
  NEW.active := v_active;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_api_keys ON public.api_keys;
CREATE TRIGGER trg_guard_api_keys
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.guard_api_keys();

DROP POLICY IF EXISTS "ak_service_role" ON public.api_keys;
DROP POLICY IF EXISTS "ak_select_own"   ON public.api_keys;
DROP POLICY IF EXISTS "ak_insert_own"   ON public.api_keys;
DROP POLICY IF EXISTS "ak_update_own"   ON public.api_keys;
DROP POLICY IF EXISTS "ak_delete_own"   ON public.api_keys;

CREATE POLICY "ak_select_own" ON public.api_keys
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = seller_id);
CREATE POLICY "ak_insert_own" ON public.api_keys
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = seller_id);
CREATE POLICY "ak_update_own" ON public.api_keys
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = seller_id)
  WITH CHECK ((SELECT auth.uid()) = seller_id);
CREATE POLICY "ak_delete_own" ON public.api_keys
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = seller_id);

-- ---------------------------------------------------------------
-- 6. Vistas: security_invoker → respetan RLS de listings
--    (antes exponían listings no activos/borradores a anon)
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'properties_full') THEN
    EXECUTE 'ALTER VIEW public.properties_full SET (security_invoker = true)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'properties_with_agent') THEN
    EXECUTE 'ALTER VIEW public.properties_with_agent SET (security_invoker = true)';
  END IF;
END $$;

-- Las funciones guard_* son de trigger: no deben exponerse por REST
REVOKE EXECUTE ON FUNCTION public.guard_profiles_privileged_cols() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_listings_featured()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_property_boosts()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_seller_profiles()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_leads_update()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_api_keys()                 FROM PUBLIC, anon, authenticated;
