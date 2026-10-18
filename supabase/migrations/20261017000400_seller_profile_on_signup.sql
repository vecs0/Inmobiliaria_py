-- =====================================================================
-- Crea seller_profiles en el alta (trigger) para el flujo con confirmación
-- de email, donde el cliente no tiene sesión tras signUp().
--
-- Conserva la whitelist de roles de 20261017000100. El trigger corre como
-- SECURITY DEFINER (owner) => is_privileged_session() = true y
-- guard_seller_profiles() deja pasar el INSERT, por eso los valores
-- protegidos (plan, límites, trial) se fijan explícitamente aquí.
-- =====================================================================

-- Un seller_profile por usuario (requerido por ON CONFLICT)
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_seller_profiles_user_id ON public.seller_profiles (user_id);
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'seller_profiles tiene user_id duplicados: índice único NO creado (limpiar manualmente)';
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role   text := lower(trim(COALESCE(NEW.raw_user_meta_data->>'role', 'user')));
  v_type   text;
  v_name   text;
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

  -- Vendedores: crear seller_profile (seller_type coherente con el rol)
  IF v_role IN ('seller', 'seller_empresa') THEN
    v_type := CASE WHEN v_role = 'seller_empresa' THEN 'empresa' ELSE 'particular' END;
    v_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');

    BEGIN
      INSERT INTO public.seller_profiles (
        user_id, seller_type, full_name, phone, company_name, ruc,
        ruc_verified, subscription_plan, subscription_status,
        max_properties, max_agents, properties_count, trial_ends_at
      )
      VALUES (
        NEW.id,
        v_type,
        v_name,
        NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
        CASE WHEN v_type = 'empresa'
             THEN COALESCE(NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'company_name', '')), ''), v_name)
             END,
        CASE WHEN v_type = 'empresa'
             THEN NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'ruc', '')), '')
             END,
        false, 'trial', 'inactive',
        5, CASE WHEN v_type = 'empresa' THEN 3 ELSE 0 END, 0,
        now() + interval '7 days'
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Nunca bloquear el registro; createSellerProfile() reintenta con sesión
      RAISE WARNING 'handle_new_user: seller_profile no creado para %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
