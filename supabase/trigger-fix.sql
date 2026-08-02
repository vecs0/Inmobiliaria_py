-- ============================================
-- TRIGGER FIX SIMPLE
-- ============================================

-- Verificar que existe la tabla
SELECT 'profiles exists:', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles');

-- Eliminar y recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger simple que solo inserta sin conflict
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Intentar insertar, ignorando errores de duplicado
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Verificar si realmente se insertó
  IF NOT FOUND THEN
    -- Ya existía, actualizar si es necesario
    UPDATE profiles 
    SET full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

SELECT 'Trigger recreated!';