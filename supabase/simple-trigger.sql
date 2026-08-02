-- ============================================
-- SIMPLE TRIGGER - solo insert sin nada complejo
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger super simple
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario')
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO NEW.id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

SELECT 'Simple trigger done!';