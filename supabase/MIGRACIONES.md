# Aplicar migraciones Supabase

El proyecto incluye migraciones en `supabase/migrations/` (orden cronológico por prefijo de fecha).

## Opción A — Supabase CLI (recomendado)

1. Instalar CLI: https://supabase.com/docs/guides/cli
2. En la raíz del proyecto:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

`db push` aplica solo las migraciones pendientes en el proyecto remoto vinculado.

## Opción B — SQL en el Dashboard

1. Abrí [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **SQL Editor**
2. Ejecutá cada archivo de `supabase/migrations/` **en orden de nombre** (del más antiguo al más reciente)
3. Si el remoto ya tiene parte del esquema base, omití las migraciones que ya estén aplicadas

## Verificación rápida

Tras aplicar, confirmá que existen:

- Vista `properties_full`
- Tablas `leads` (con `score`, `is_read`), `property_boosts`, `seller_profiles`
- Extensión `vector` / columnas de búsqueda semántica (migración `pgvector_semantic`)

## Variables de entorno

Completá `.env.local` a partir de `.env.example` (Stripe, OpenAI, Supabase, Resend, `CRON_SECRET`).
