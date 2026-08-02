-- ============================================================
-- Fase 6-C: IA — pgvector + Búsqueda Semántica
-- ============================================================

-- 1. Habilitar extensión pgvector (requiere Supabase Pro o habilitar en Dashboard)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 2. Agregar columna embedding a listings (1536 dims = text-embedding-3-small)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Índice HNSW para búsqueda aproximada por similitud coseno
CREATE INDEX IF NOT EXISTS listings_embedding_idx
  ON public.listings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Función RPC para búsqueda semántica
DROP FUNCTION IF EXISTS public.match_properties(vector, float, int);
CREATE OR REPLACE FUNCTION public.match_properties(
  query_embedding  vector(1536),
  match_threshold  float    DEFAULT 0.3,
  match_count      int      DEFAULT 6
)
RETURNS TABLE (
  id          text,
  title       text,
  location    text,
  price       numeric,
  type        text,
  bedrooms    int,
  bathrooms   int,
  sqm         numeric,
  images      text[],
  featured    boolean,
  similarity  float
)
LANGUAGE sql STABLE SET search_path = public, extensions AS $$
  SELECT
    l.id::text,
    l.title::text,
    (COALESCE(p.neighborhood, '') || ', ' || COALESCE(p.city, ''))::text AS location,
    l.price,
    p.type::text,
    p.bedrooms,
    p.bathrooms,
    p.sqm,
    l.images,
    l.featured,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM public.listings l
  JOIN public.property_entities p ON l.entity_id = p.id
  WHERE
    l.status = 'active'
    AND l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 5. Función RPC para propiedades similares (por ID de propiedad)
DROP FUNCTION IF EXISTS public.similar_properties(text, int);
CREATE OR REPLACE FUNCTION public.similar_properties(
  source_property_id  text,
  match_count         int DEFAULT 4
)
RETURNS TABLE (
  id          text,
  title       text,
  location    text,
  price       numeric,
  type        text,
  bedrooms    int,
  bathrooms   int,
  sqm         numeric,
  images      text[],
  featured    boolean,
  similarity  float
)
LANGUAGE sql STABLE SET search_path = public, extensions AS $$
  SELECT
    l.id::text,
    l.title::text,
    (COALESCE(p.neighborhood, '') || ', ' || COALESCE(p.city, ''))::text AS location,
    l.price,
    p.type::text,
    p.bedrooms,
    p.bathrooms,
    p.sqm,
    l.images,
    l.featured,
    1 - (l.embedding <=> src.embedding) AS similarity
  FROM public.listings l
  JOIN public.property_entities p ON l.entity_id = p.id
  CROSS JOIN (
    SELECT embedding FROM public.listings WHERE id::text = source_property_id
  ) src
  WHERE
    l.status = 'active'
    AND l.id::text <> source_property_id
    AND l.embedding IS NOT NULL
    AND src.embedding IS NOT NULL
  ORDER BY l.embedding <=> src.embedding
  LIMIT match_count;
$$;
