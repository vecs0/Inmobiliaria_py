-- ============================================
-- VERIFICACIÓN Y MIGRACIÓN DE ESQUEMA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VERIFICAR ESQUEMA ACTIVO DE PROPERTIES
-- ============================================
\echo '=== VERIFICANDO ESQUEMA DE properties ==='

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR DATOS EXISTENTES
-- ============================================
\echo '=== VERIFICANDO DATOS ==='

-- Ver propiedades con esquema nuevo
SELECT id, title, bedrooms, bathrooms, sqm 
FROM properties 
LIMIT 3;

-- Ver si hay propiedades con esquema viejo
SELECT id, title, beds, baths, area 
FROM properties 
LIMIT 3;

-- Contar total
SELECT COUNT(*) as total_properties FROM properties;

-- ============================================
-- 3. IDENTIFICAR QUÉ ESQUEMA SE USA
-- ============================================
\echo '=== IDENTIFICANDO ESQUEMA ==='

-- Si tiene bedrooms usa esquema nuevo
-- Si tiene beds usa esquema viejo

DO $$
DECLARE
    has_bedrooms BOOLEAN;
    has_beds BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'bedrooms'
    ) INTO has_bedrooms;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'beds'
    ) INTO has_beds;
    
    RAISE NOTICE 'Esquema detectado: bedrooms=%, beds=%', has_bedrooms, has_beds;
END $$;

-- ============================================
-- 4. MIGRACIÓN (solo si hay datos con esquema viejo)
-- ============================================
\echo '=== MIGRANDO DATOS (si es necesario) ==='

-- Migrar beds -> bedrooms, baths -> bathrooms, area -> sqm
UPDATE properties 
SET 
    bedrooms = beds,
    bathrooms = baths,
    sqm = area
WHERE 
    bedrooms IS NULL 
    AND beds IS NOT NULL;

-- Verificar migración
SELECT 
    COUNT(*) as total,
    COUNT(bedrooms) as with_bedrooms,
    COUNT(beds) as with_beds
FROM properties;

-- ============================================
-- 5. VERIFICAR PROFILES
-- ============================================
\echo '=== VERIFICANDO PROFILES ==='

SELECT * FROM profiles LIMIT 5;
SELECT COUNT(*) as total_profiles FROM profiles;

-- ============================================
-- 6. VERIFICAR FUNCIONES DE ROL
-- ============================================
\echo '=== PROBANDO FUNCIONES ==='

-- Probar is_admin() - debería retornar false si no hay usuario logueado
SELECT is_admin();
SELECT is_agent();

-- ============================================
-- 7. LIMPIEZA (OPCIONAL - solo si hay conflictos)
-- ============================================
\echo '=== LIMPIEZA DE POLICÍAS DUPLICADAS ==='

-- Ver políticas existentes
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('properties', 'profiles', 'leads');