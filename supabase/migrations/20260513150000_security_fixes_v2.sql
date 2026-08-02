-- Fix restante 1: decrement_properties_count search_path
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

-- Fix restante 2 y 3: handle_new_user — revocar EXECUTE a anon y authenticated
-- Primero recrearla con search_path fijo
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

-- Revocar acceso REST a handle_new_user (solo debe correr como trigger)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
