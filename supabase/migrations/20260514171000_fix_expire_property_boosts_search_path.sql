-- Fix Security Advisor WARN: function_search_path_mutable para expire_property_boosts
CREATE OR REPLACE FUNCTION expire_property_boosts()
RETURNS void 
LANGUAGE plpgsql 
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE property_boosts
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
END;
$$;
