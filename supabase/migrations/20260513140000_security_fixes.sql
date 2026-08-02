-- =============================================================
-- SECURITY FIXES — InmobiliariaPY V3
-- Resuelve las 7 WARN + 2 INFO del Asesor de Seguridad Supabase
-- =============================================================

-- ---------------------------------------------------------------
-- FIX 1: function_search_path_mutable
-- Todas las funciones necesitan SET search_path para evitar
-- ataques de schema poisoning (search_path injection).
-- ---------------------------------------------------------------

-- 1a. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1b. update_saved_searches_updated_at
CREATE OR REPLACE FUNCTION public.update_saved_searches_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1c. increment_properties_count
CREATE OR REPLACE FUNCTION public.increment_properties_count(profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE seller_profiles
  SET properties_count = COALESCE(properties_count, 0) + 1
  WHERE id = profile_id;
END;
$$;

-- 1d. decrement_properties_count
CREATE OR REPLACE FUNCTION public.decrement_properties_count(profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE seller_profiles
  SET properties_count = GREATEST(COALESCE(properties_count, 0) - 1, 0)
  WHERE id = profile_id;
END;
$$;

-- 1e. handle_new_user — Mantiene SECURITY DEFINER (necesario para
--     escribir en public.profiles desde el trigger auth.users),
--     pero se le fija el search_path para eliminar la vulnerabilidad.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------
-- FIX 2: handle_new_user no debe ser callable via REST API
-- Revocar EXECUTE a anon y authenticated — solo debe ejecutarse
-- internamente como trigger en auth.users.
-- ---------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ---------------------------------------------------------------
-- FIX 3: RLS INFO — Tablas con RLS activo pero sin políticas
-- leads: política mínima para que sellers vean sus propios leads
-- subscription_plans: solo lectura pública (es catálogo)
-- ---------------------------------------------------------------

-- leads: sellers ven leads de sus propiedades, admins ven todo
CREATE POLICY "sellers_see_own_leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_profiles sp ON sp.id = l.seller_profile_id
      WHERE l.id = leads.property_id
        AND sp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

CREATE POLICY "admins_manage_leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

-- subscription_plans: cualquiera puede ver los planes (catálogo público)
CREATE POLICY "public_read_subscription_plans"
  ON public.subscription_plans
  FOR SELECT
  TO anon, authenticated
  USING (true);
