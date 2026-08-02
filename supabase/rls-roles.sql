-- ============================================
-- ROLE-BASED SECURITY - InmobiliariaPY
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- ENUM: Roles disponibles
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');

-- ============================================
-- TABLA: profiles (extiende auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- HABILITAR RLS EN PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCIONES HELPER PARA ROLES
-- ============================================

-- Obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE;

-- Verificar si el usuario es agente
CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  );
$$ LANGUAGE sql STABLE;

-- Verificar si el usuario puede modificar una propiedad (es dueñ@ o admin)
CREATE OR REPLACE FUNCTION can_edit_property(property_owner_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  ) OR auth.uid() = property_owner_id;
$$ LANGUAGE sql STABLE;

-- ============================================
-- POLICÍAS RLS PARA PROFILES
-- ============================================

-- Usuarios pueden leer su propio perfil
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Solo admins pueden ver todos los perfiles
CREATE POLICY "profiles_read_admins" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Solo admins pueden cambiar roles
CREATE POLICY "profiles_update_role_admin" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Solo admins pueden insertar perfiles
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ACTUALIZAR POLICÍAS PARA AGENTS
-- ============================================

-- Agents: lectura pública, escritura solo para admins y agents
DROP POLICY IF EXISTS "agents_read_public" ON agents;
DROP POLICY IF EXISTS "agents_write_auth" ON agents;

CREATE POLICY "agents_read_public" ON agents
  FOR SELECT USING (true);

CREATE POLICY "agents_insert_admin" ON agents
  FOR INSERT WITH CHECK (is_admin() OR is_agent());

CREATE POLICY "agents_update_admin" ON agents
  FOR UPDATE USING (is_admin() OR is_agent());

CREATE POLICY "agents_delete_admin" ON agents
  FOR DELETE USING (is_admin());

-- ============================================
-- ACTUALIZAR POLICÍAS PARA PROPERTIES
-- ============================================

-- Properties: lectura pública, escritura para admins y agents
DROP POLICY IF EXISTS "properties_read_public" ON properties;
DROP POLICY IF EXISTS "properties_write_auth" ON properties;

CREATE POLICY "properties_read_public" ON properties
  FOR SELECT USING (true);

CREATE POLICY "properties_insert_agent" ON properties
  FOR INSERT WITH CHECK (is_admin() OR is_agent());

CREATE POLICY "properties_update_agent" ON properties
  FOR UPDATE USING (is_admin() OR is_agent());

CREATE POLICY "properties_delete_admin" ON properties
  FOR DELETE USING (is_admin());

-- ============================================
-- ACTUALIZAR POLICÍAS PARA LEADS
-- ============================================

DROP POLICY IF EXISTS "leads_read_auth" ON leads;
DROP POLICY IF EXISTS "public_insert_leads" ON leads;

-- Lectura: solo admins y agents ven leads
CREATE POLICY "leads_read_agents" ON leads
  FOR SELECT USING (is_admin() OR is_agent());

-- Insert: cualquier usuario autenticado o público puede crear leads
CREATE POLICY "leads_insert_public" ON leads
  FOR INSERT WITH CHECK (
    name IS NOT NULL AND
    email IS NOT NULL AND
    length(email) > 5
  );

-- Update: solo admins y agents pueden actualizar status
CREATE POLICY "leads_update_agents" ON leads
  FOR UPDATE USING (is_admin() OR is_agent());

-- Delete: solo admins
CREATE POLICY "leads_delete_admin" ON leads
  FOR DELETE USING (is_admin());

-- ============================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'user'::user_role
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNCIONES DE ADMINISTRACIÓN
-- ============================================

-- Asignar rol a usuario (solo admin)
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role user_role)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden cambiar roles';
  END IF;

  UPDATE profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Obtener todos los usuarios (solo admin)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden ver usuarios';
  END IF;

  RETURN QUERY SELECT p.id, p.email, p.full_name, p.role, p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTA: Para usar en frontend
-- ============================================
-- El campo 'role' se guarda en user_metadata al registrar:
-- await supabase.auth.signUp({
--   email,
--   options: { data: { full_name, role: 'agent' } }
-- })
--
-- Roles posibles: 'admin', 'agent', 'user'
-- Por defecto nuevos usuarios son 'user'