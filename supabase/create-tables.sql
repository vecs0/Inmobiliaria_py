-- ============================================
-- VERIFICAR Y CREAR TODO DESDE CERO
-- ============================================

-- 1. Verificar tablas existentes
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Crear tipo user_role si no existe
DO $$ 
BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Crear tabla profiles
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

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. Verificar que se creó
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles;