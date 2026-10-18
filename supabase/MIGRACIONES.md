# Migraciones Supabase — InmobiliariaPY V3

Fuente de verdad: `supabase/migrations/` (orden por prefijo de fecha).
`supabase/legacy/` = SQL histórico, **NO APLICAR**.

## Orden de aplicación

| # | Archivo | Qué hace |
|---|---|---|
| 0 | `20260101000000_baseline_missing.sql` | Crea (IF NOT EXISTS) las tablas núcleo que existían en la DB viva sin migración: `profiles`, `agents`, `properties` (legacy), `seller_profiles`, `property_entities`, `listings`, `subscription_plans`, `payments`, `leads`, `favorites`, enum `user_role`, vistas `properties_full` / `properties_with_agent`. En la DB viva es un no-op. |
| 1 | `20260513120000_property_views.sql` … `20260520101700_push_subscriptions_and_agents.sql` | Migraciones históricas (vistas, saved_searches, boosts, pgvector, api_keys, push). |
| 2 | `20261017000100_security_hardening.sql` | Trigger `handle_new_user` con whitelist de roles; guards (triggers) en `profiles.role`, `listings.featured`, `property_boosts`, `seller_profiles` (plan/límites/verificación), `leads`, `api_keys`; políticas RLS canónicas para listings, leads, favorites, agents, property_entities, payments, api_keys; columnas `leads.seller_id/buyer_id/score/score_details/is_read/source/assigned_to`, `seller_profiles.max_agents`, `payments.stripe_session_id/stripe_invoice_id` (+ índices únicos); FKs de `leads`/`favorites.property_id` → `listings`; vistas con `security_invoker`. |
| 3 | `20261017000200_rpc_stripe_new_tables.sql` | `stripe_events` (idempotencia), RPC `increment_api_key_usage`, `reset_api_key_daily_counters` y `expire_property_boosts` (apaga `listings.featured`) solo para service_role; tablas `search_history` e `import_feeds`. |
| 4 | `20261017000300_storage_property_photos.sql` | Bucket público `property-photos` + políticas: escribir solo en `sellers/<uid>/…` o `<uid>/…`. |

### ¿Por qué el baseline tiene fecha 2026-01-01?
Las migraciones de mayo (`security_fixes`, `pgvector_semantic`, `performance_fixes`) alteran
`listings`, `leads`, `payments`… que ninguna migración creaba: en una DB nueva fallaban. El
baseline corre primero y las crea.

## Aplicar en la DB VIVA (pasos manuales del dueño)

```bash
supabase link --project-ref TU_PROJECT_REF
# El baseline es anterior a migraciones ya aplicadas → hace falta --include-all
supabase db push --include-all
# Alternativa: marcarlo como aplicado sin ejecutarlo
#   supabase migration repair --status applied 20260101000000
#   supabase db push
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Después de aplicar:
1. Revisar los NOTICE del push: si aparece "duplicados … índice único NO creado"
   (seller_profiles.user_id, favorites, payments.stripe_invoice_id), limpiar duplicados y re-ejecutar ese bloque.
2. Los FKs nuevos de `leads/favorites.property_id → listings` y `leads.seller_id` son `NOT VALID`
   (filas históricas que apuntaban a `properties` no se validan). Tras limpiar:
   `ALTER TABLE leads VALIDATE CONSTRAINT leads_property_id_fkey;` (ídem favorites).
3. Promover administradores manualmente (el registro ya NO acepta `admin`):
   `UPDATE profiles SET role = 'admin' WHERE email = '…';` (SQL Editor, como postgres).
4. Si existía el bucket `property-photos` con otra config, revisar Storage → límite 8 MB / mime.

## DB nueva (local)

```bash
supabase start
supabase db reset   # aplica todo en orden + seed.sql
```
Requiere la extensión `vector` (incluida en Supabase).

## Verificación rápida

- `select role from profiles` de un usuario registrado con metadata `role=admin` → `user`.
- `update profiles set role='admin'` como usuario → error 42501.
- Vendedor: `update listings set featured=true` → se ignora; insert de boost `active` → queda `pending`.
- `select * from stripe_events` como anon/authenticated → permiso denegado.

## Variables de entorno

Completá `.env.local` a partir de `.env.example` (Stripe, OpenAI, Supabase, Resend, `CRON_SECRET`).
