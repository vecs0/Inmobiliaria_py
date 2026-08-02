-- Fix: decrement_properties_count() versión trigger sin search_path
-- Esta es la función usada como TRIGGER en listings al hacer DELETE
CREATE OR REPLACE FUNCTION public.decrement_properties_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE seller_profiles
  SET properties_count = GREATEST(0, COALESCE(properties_count, 0) - 1)
  WHERE id = OLD.seller_profile_id;
  RETURN OLD;
END;
$$;
