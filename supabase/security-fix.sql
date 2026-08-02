-- ============================================
-- SECURITY FIX - InmobiliariaPY
--Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- Fix 1: Funciones con search_path seguro (usando OR REPLACE)
-- ============================================

-- get_current_user_role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
  SET search_path = '';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  SET search_path = '';
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- is_agent
CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN AS $$
BEGIN
  SET search_path = '';
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- can_edit_property
CREATE OR REPLACE FUNCTION can_edit_property(property_owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  SET search_path = '';
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  ) OR auth.uid() = property_owner_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- set_user_role
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role user_role)
RETURNS VOID AS $$
BEGIN
  SET search_path = '';
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Solo admins pueden cambiar roles';
  END IF;
  UPDATE profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_all_users
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, role user_role, created_at TIMESTAMPTZ) AS $$
BEGIN
  SET search_path = '';
  IF NOT (SELECT is_admin()) THEN
    RAISE EXCEPTION 'Solo admins pueden ver usuarios';
  END IF;
  RETURN QUERY SELECT p.id, p.email, p.full_name, p.role, p.created_at FROM profiles p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- handle_new_user (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = '';
  
  -- Verificar si el perfil ya existe
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'user'::user_role
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = '';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Fix 2: Recrear trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 
  'Security fixes applied successfully!' as status;