-- ============================================
-- VERIFICAR Y CORREGIR TRIGGER
-- ============================================

-- 1. Eliminar trigger viejo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar función vieja
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Crear función Nueva bien simple
CREATE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Google');
  
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, user_email, user_name, 'user'::user_role)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 4. Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- 5. Verificar
SELECT 'Trigger verificado!' as status;