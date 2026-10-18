-- =====================================================================
-- BASELINE — tablas núcleo que existían en la DB viva pero NO en migraciones
-- InmobiliariaPY V3 · 2026-10-17
--
-- Por qué timestamp TEMPRANO (20260101000000):
--   Las migraciones 20260513140000 (security_fixes), 20260513190000 (pgvector)
--   y 20260514170000 (performance_fixes) hacen ALTER / CREATE POLICY / CREATE INDEX
--   sobre listings, leads, favorites, payments, subscription_plans, properties...
--   En una DB nueva esas tablas no existían → la cadena fallaba. Este archivo
--   corre PRIMERO y las crea.
--
-- En la DB viva es un NO-OP (todo es IF NOT EXISTS / bloques condicionales).
--   Opción A: `supabase db push --include-all` (lo ejecuta, no cambia nada).
--   Opción B: `supabase migration repair --status applied 20260101000000`.
--
-- Columnas derivadas de src/lib/supabase/database.types.ts (esquema vivo).
-- Los DEFAULT/CHECK son aproximados donde los tipos no los revelan.
-- Las POLÍTICAS RLS definitivas se definen en 20261017000100_security_hardening.sql
-- (aquí solo se habilita RLS, para no chocar con CREATE POLICY de migraciones
-- intermedias que no usan DROP POLICY IF EXISTS).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------
-- Enum de roles
-- ---------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'agent', 'seller', 'seller_empresa', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller_empresa';

-- ---------------------------------------------------------------
-- Función updated_at genérica (se re-define con search_path en 20260513140000)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        public.user_role DEFAULT 'user',
  phone       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles (role);

-- ---------------------------------------------------------------
-- agents
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text NOT NULL DEFAULT '',
  whatsapp    text NOT NULL DEFAULT '',
  email       text NOT NULL,
  photo       text NOT NULL DEFAULT '',
  title       text NOT NULL DEFAULT 'Agente inmobiliario',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- properties (LEGACY — no usar en código nuevo; se conserva para que
-- performance_fixes y datos históricos no fallen)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  location      text NOT NULL,
  neighborhood  text NOT NULL,
  city          text NOT NULL,
  price         numeric(14,2) NOT NULL,
  currency      text NOT NULL,
  type          text NOT NULL,
  bedrooms      integer NOT NULL DEFAULT 0,
  bathrooms     integer NOT NULL DEFAULT 0,
  sqm           numeric NOT NULL,
  parking       integer NOT NULL DEFAULT 0,
  featured      boolean NOT NULL DEFAULT false,
  tag           text,
  image         text NOT NULL,
  images        text[] NOT NULL DEFAULT '{}',
  description   text NOT NULL,
  amenities     text[] NOT NULL DEFAULT '{}',
  agent_id      uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  "yearBuilt"   integer,
  floor         integer,
  latitude      numeric,
  longitude     numeric,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- seller_profiles
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_type             text NOT NULL CHECK (seller_type IN ('particular', 'empresa')),
  full_name               text,
  phone                   text,
  cedula                  text,
  company_name            text,
  ruc                     text,
  ruc_verified            boolean DEFAULT false,
  has_website             boolean DEFAULT false,
  website_url             text,
  subscription_plan       text DEFAULT 'trial',
  subscription_status     text DEFAULT 'inactive',
  trial_ends_at           timestamptz,
  max_properties          integer DEFAULT 5,
  max_agents              integer DEFAULT 0,
  properties_count        integer DEFAULT 0,
  stripe_customer_id      text,
  stripe_price_id         text,
  stripe_subscription_id  text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON public.seller_profiles (user_id);

-- ---------------------------------------------------------------
-- property_entities (entidad física deduplicada)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_entities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL,
  city             text NOT NULL,
  neighborhood     text NOT NULL,
  address          text,
  bedrooms         integer NOT NULL DEFAULT 0,
  bathrooms        integer NOT NULL DEFAULT 0,
  parking          integer NOT NULL DEFAULT 0,
  sqm              numeric NOT NULL,
  floor            integer,
  year_built       integer,
  latitude         numeric,
  longitude        numeric,
  similarity_hash  text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_entities_similarity_hash ON public.property_entities (similarity_hash);
CREATE INDEX IF NOT EXISTS idx_property_entities_city ON public.property_entities (city);

-- ---------------------------------------------------------------
-- listings (publicación comercial — MODELO CANÓNICO)
-- La columna embedding se agrega en 20260513190000_pgvector_semantic.sql
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id          uuid NOT NULL REFERENCES public.property_entities(id) ON DELETE CASCADE,
  seller_profile_id  uuid REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  agent_id           uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  title              text NOT NULL,
  description        text NOT NULL,
  price              numeric(14,2) NOT NULL,
  currency           text NOT NULL DEFAULT 'USD',
  operation_type     text NOT NULL DEFAULT 'venta',
  status             text NOT NULL DEFAULT 'active',
  featured           boolean NOT NULL DEFAULT false,
  tag                text,
  image              text NOT NULL,
  images             text[] NOT NULL DEFAULT '{}',
  amenities          text[] NOT NULL DEFAULT '{}',
  source             text NOT NULL DEFAULT 'manual',
  source_url         text,
  external_id        text,
  published_at       timestamptz DEFAULT now(),
  expires_at         timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listings_status   ON public.listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings (featured) WHERE featured = true;

-- ---------------------------------------------------------------
-- subscription_plans (catálogo)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id               serial PRIMARY KEY,
  name             text NOT NULL,
  plan_type        text NOT NULL,
  price_usd        numeric(10,2) NOT NULL DEFAULT 0,
  max_properties   integer NOT NULL DEFAULT 0,
  max_agents       integer NOT NULL DEFAULT 0,
  features         jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active        boolean NOT NULL DEFAULT true,
  stripe_price_id  text,
  created_at       timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_profile_id         uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  plan_id                   integer REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  amount                    numeric(12,2) NOT NULL,
  currency                  text NOT NULL DEFAULT 'USD',
  status                    text NOT NULL DEFAULT 'pending',
  stripe_invoice_id         text,
  stripe_payment_intent_id  text,
  stripe_subscription_id    text,
  billing_period_start      timestamptz,
  billing_period_end        timestamptz,
  created_at                timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- leads (en DB nueva ya apunta a listings; en la viva el FK se migra
-- en 20261017000100_security_hardening.sql)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text,
  message      text NOT NULL,
  property_id  uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  status       text DEFAULT 'pending',
  created_at   timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id  uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- RLS habilitado en todo (políticas en 20261017000100)
-- ---------------------------------------------------------------
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_entities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites           ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- Triggers updated_at — solo si la tabla aún no tiene uno con esta función
-- ---------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','agents','properties','seller_profiles','property_entities','listings'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger tg
      JOIN pg_proc p ON p.oid = tg.tgfoid
      WHERE tg.tgrelid = format('public.%I', t)::regclass
        AND p.proname = 'update_updated_at_column'
        AND NOT tg.tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        t
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- Vistas properties_full / properties_with_agent
-- Solo se crean si NO existen (CREATE OR REPLACE fallaría en la DB viva si
-- el orden/nombre de columnas difiere). security_invoker se fija en 20261017000100.
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'properties_full') THEN
    EXECUTE $v$
      CREATE VIEW public.properties_full AS
      SELECT
        l.id,
        l.entity_id,
        l.seller_profile_id,
        l.agent_id,
        l.title,
        l.description,
        l.price,
        l.currency,
        l.operation_type,
        l.status,
        l.featured,
        l.tag,
        l.image,
        l.images,
        l.amenities,
        l.source,
        l.external_id,
        l.published_at,
        l.expires_at,
        l.created_at,
        l.updated_at,
        e.type,
        e.city,
        e.neighborhood,
        (COALESCE(e.neighborhood, '') || ', ' || COALESCE(e.city, '')) AS location,
        e.bedrooms,
        e.bathrooms,
        e.parking,
        e.sqm,
        e.floor,
        e.year_built AS "yearBuilt",
        e.latitude,
        e.longitude,
        a.name     AS agent_name,
        a.phone    AS agent_phone,
        a.whatsapp AS agent_whatsapp,
        a.email    AS agent_email,
        a.photo    AS agent_photo,
        a.title    AS agent_title
      FROM public.listings l
      JOIN public.property_entities e ON e.id = l.entity_id
      LEFT JOIN public.agents a ON a.id = l.agent_id
    $v$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'properties_with_agent') THEN
    EXECUTE 'CREATE VIEW public.properties_with_agent AS SELECT * FROM public.properties_full';
  END IF;
END $$;
