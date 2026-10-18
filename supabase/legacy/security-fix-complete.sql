-- ============================================
-- SECURITY FIX COMPLETO - EjECUTAR EN ORDEN
-- ============================================

-- ============================================
-- PARTE 1: Crear/verificar estructura
-- ============================================

-- Crear tipo user_role
DO $$ 
BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tabla profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (id = auth.uid());

-- ============================================
-- PARTE 2: Revocar permisos
-- ============================================

REVOKE ALL ON FUNCTION can_edit_property(UUID) FROM anon;
REVOKE ALL ON FUNCTION get_all_users() FROM anon;
REVOKE ALL ON FUNCTION get_current_user_role() FROM anon;
REVOKE ALL ON FUNCTION handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION is_admin() FROM anon;
REVOKE ALL ON FUNCTION is_agent() FROM anon;
REVOKE ALL ON FUNCTION set_user_role(UUID, user_role) FROM anon;
REVOKE ALL ON FUNCTION update_updated_at_column() FROM anon;

REVOKE ALL ON FUNCTION can_edit_property(UUID) FROM authenticated;
REVOKE ALL ON FUNCTION get_all_users() FROM authenticated;
REVOKE ALL ON FUNCTION get_current_user_role() FROM authenticated;
REVOKE ALL ON FUNCTION handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION is_admin() FROM authenticated;
REVOKE ALL ON FUNCTION is_agent() FROM authenticated;
REVOKE ALL ON FUNCTION set_user_role(UUID, user_role) FROM authenticated;
REVOKE ALL ON FUNCTION update_updated_at_column() FROM authenticated;

-- ============================================
-- PARTE 3: Crear funciones
-- ============================================

-- get_current_user_role
CREATE FUNCTION get_current_user_role()
RETURNS user_role
SET search_path = 'public, auth'
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid(); $$;

-- is_admin
CREATE FUNCTION is_admin()
RETURNS boolean
SET search_path = 'public, auth'
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

-- is_agent
CREATE FUNCTION is_agent()
RETURNS boolean
SET search_path = 'public, auth'
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent')); $$;

-- can_edit_property
CREATE FUNCTION can_edit_property(property_owner_id UUID)
RETURNS boolean
SET search_path = 'public, auth'
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'agent')) OR auth.uid() = property_owner_id; $$;

-- set_user_role
CREATE FUNCTION set_user_role(target_user_id UUID, new_role user_role)
RETURNS void
SET search_path = 'public, auth'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admins'; END IF;
  UPDATE public.profiles SET role = new_role, updated_at = NOW() WHERE id = target_user_id;
END;
$$;

-- get_all_users
CREATE FUNCTION get_all_users()
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, role user_role, created_at TIMESTAMPTZ)
SET search_path = 'public, auth'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Solo admins'; END IF;
  RETURN QUERY SELECT p.id, p.email, p.full_name, p.role, p.created_at FROM public.profiles p;
END;
$$;

-- handle_new_user (trigger)
CREATE FUNCTION handle_new_user()
RETURNS trigger
SET search_path = 'public, auth'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN RETURN NEW; END IF;
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- update_updated_at_column
CREATE FUNCTION update_updated_at_column()
RETURNS trigger
SET search_path = 'public, auth'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- PARTE 4: Recrear trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

SELECT 'Security fixes complete!' as status;