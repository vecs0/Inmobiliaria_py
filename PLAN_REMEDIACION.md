# Plan de remediación — InmobiliariaPY V3 (2026-10-17)

Objetivo: llevar el sistema de ~40% funcional real a 80–85%.

## Decisiones globales (contrato entre paquetes)

1. **Modelo de datos canónico = `listings` + `property_entities` + `seller_profiles` (+ vista `properties_full`).**
   La tabla `properties` es legacy: ningún código nuevo la lee ni escribe. Rutas que hoy usan `properties` se migran a `listings`/`properties_full`.
   - Dueño de un listing: `listings.seller_profile_id` → `seller_profiles.id` → `seller_profiles.user_id = auth.uid()`.
   - Embeddings: `listings.embedding` (RPC `match_properties`, `similar_properties`).
2. **Cliente service role:** `createAdminClient()` de `src/lib/supabase/admin.ts` (lazy, solo servidor). Prohibido `createClient(url, SERVICE_ROLE)` a nivel de módulo.
3. **Clientes externos lazy:** Resend/OpenAI/Stripe se instancian dentro del handler.
4. **URL base única:** `process.env.NEXT_PUBLIC_APP_URL` (eliminar `NEXT_PUBLIC_SITE_URL`).
5. **Roles reales en DB:** `profiles.role` ∈ `user | seller | seller_empresa | agent | admin`; tipo de vendedor en `seller_profiles.seller_type` ∈ `particular | empresa`.
6. **Next 16:** `params`/`searchParams` son `Promise` → siempre `await`. Middleware vive en `src/proxy.ts` (`export function proxy`).
7. **Contratos de API nuevos/cambiados**
   - `POST /api/contact` body `{ listingId: string, name: string, email: string, phone?: string, message: string }` → inserta lead (con `seller_id` = seller_profile dueño) y notifica al vendedor. Resp `{ ok: true }` | `{ error }`.
   - `POST /api/favorites` body `{ listingId }` → agrega; `DELETE /api/favorites?listingId=` → quita; `GET /api/favorites` → `{ ids: string[] }`. Requiere login.
   - Server actions en `src/lib/actions/properties.ts`: `deleteListing(id: string)`, `setListingStatus(id: string, status: 'active' | 'paused')` → `{ ok: boolean, error?: string }`.
   - Reset password: la página usa `supabase.auth.resetPasswordForEmail` desde el cliente (sin `/api/auth/reset`), redirect a `/auth/update-password`.
8. **No ejecutar `next build`** (lo corre el orquestador). Sí `npx tsc --noEmit`. No commitear. Tocar SOLO los archivos del paquete propio.

## Paquetes

| # | Paquete | Complejidad | Modelo | Archivos (propiedad exclusiva) |
|---|---|---|---|---|
| 0 | Base: build verde, admin client, proxy | Baja | orquestador | ✅ hecho |
| A | DB + RLS + seguridad SQL | Alta | Opus | `supabase/**`, `src/lib/supabase/database.types.ts`, `.gitignore` |
| B | Pagos, cron, API pública, push | Alta | Opus | `src/app/api/stripe/**`, `src/app/api/cron/**` (excepto notify-alerts, sync-feeds), `src/app/api/v1/**`, `src/app/api/push/**`, `src/lib/api/validate-key.ts`, `src/lib/supabase/boost-actions.ts`, `src/lib/supabase/api-key-actions.ts`, `src/lib/stripe/**`, `vercel.json`, `.env.example` |
| C1 | Import, IA, alertas, feeds | Media | Sonnet | `src/app/api/import/**`, `src/app/api/ai/**`, `src/app/api/search/**`, `src/app/api/cron/notify-alerts/**`, `src/app/api/cron/sync-feeds/**`, `src/lib/import/**`, `src/lib/openai.ts`, `src/lib/deduplication.ts` |
| C2 | Leads, CRUD, favoritos, auth server | Alta | Opus | `src/app/api/contact/**`, `src/app/api/seller/**`, `src/app/api/favorites/**` (nuevo), `src/app/api/track-view/**`, `src/app/api/upload/**`, `src/lib/actions/**`, `src/lib/supabase/{actions,favorites,analytics-actions,similar-actions,auth-hooks}.ts`, `src/lib/auth/**` |
| D | Frontend core (flujos de usuario) | Alta | Opus | `src/components/v2/{LandingClient,ListingClient,DetailClient,FavoritosClient,DashboardClient,BuyerDashboardClient,LegacyAuthClient,SellerPropertiesClient,NuevaPropertyClient,PropertyCard,dashboard-helpers,DemoPageSwitcher,RecomendadasClient,RecientesClient}.tsx`, `src/components/PublicChrome.tsx`, `src/components/map/**` (nuevo), `src/app/propiedades/**`, `src/app/auth/**`, `src/app/(seller)/vendedor/{layout,page}.tsx`, `src/app/{error,not-found,loading}.tsx`, `src/app/api-docs/**` (nuevo), `src/lib/v2-data.tsx`, `src/lib/property-adapter.ts`, `src/lib/seller/**` |
| E | Frontend secundario, i18n, responsive, admin, limpieza | Media | Sonnet | `src/lib/i18n/**`, `src/app/layout.tsx`, `src/components/NavV2.tsx`, `src/components/LanguageCurrencySelector.tsx`, `src/components/v2/{SellerShell,CompradorSidebar}.tsx`, `src/app/v2-styles.css`, `src/app/admin/**`, `src/components/admin/**`, `src/app/(seller)/vendedor/api-keys/**`, `public/sw.js`, `src/hooks/use-service-worker.ts`, `legacy-ui/`, componentes muertos, `tsconfig.json`, `eslint.config.mjs`, `next.config.mjs`, `tailwind.config.ts` |

## Pasos manuales del dueño (no automatizables)
- `supabase db push` (aplicar migraciones de A) y `supabase gen types typescript` para regenerar tipos reales.
- Crear claves VAPID, configurar env vars en Vercel, webhook de Stripe apuntando a `/api/stripe/webhook`, dominio verificado en Resend.
