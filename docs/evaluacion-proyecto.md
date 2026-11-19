# 🔍 Evaluación del Proyecto — InmobiliariaPY V3

> Auditoría técnica realizada sobre el repositorio en su estado actual.
> Proyecto iniciado: **03/05/2026** · Última actualización del código: **20/05/2026**

---

## 1. Resumen ejecutivo

**InmobiliariaPY** es una plataforma inmobiliaria para Paraguay construida con **Next.js 16 + React 19 + Supabase + Stripe + OpenAI**. Tiene roles diferenciados (comprador, vendedor particular, vendedor empresa, admin), búsqueda con IA, importación masiva XML/CSV, pagos integrados, push notifications, i18n (es/en) y una API pública v1.

La **UI/frontend está muy avanzada** (≈85% de las pantallas dibujadas y con estado), pero el **backend de datos no puede operar**: el código está escrito contra un esquema Supabase que **no existe en el repositorio** (faltan las tablas `listings`, `property_entities`, `favorites`, `subscription_plans`, `payments`, `search_history`, `import_feeds` y la vista `properties_full`).

**Estado global estimado: ≈ 55%**

- Frontend / UI: **≈ 85%**
- Backend de datos operativo: **≈ 40%**

**Bloqueante principal:** la brecha esquema-código. La app compila y navega con **mocks**, pero cualquier operación real sobre propiedades (crear, editar, importar, favoritos, pagos, analytics) devuelve `relation "..." does not exist`.

---

## 2. % de avance por módulo

| Módulo | UI | Datos/Backend | Avance | Nota |
|---|---|---|---|---|
| **Autenticación** (login, register, reset, middleware, RLS) | ✅ completa | ⚠️ reset roto | **80%** | Reset sin ruta API; admin lee `auth.users` con anon |
| **Propiedades públicas** (landing, listado, detalle, búsqueda) | ✅ completa | ❌ mocks | **60%** | Consultas a `listings`/`properties_full` inexistentes; solo funcionan fallbacks a `v2-data.tsx` |
| **Vendedor** (dashboard, propiedades, agentes, perfil, boosts, suscripción) | ✅ amplia | ❌ tablas faltantes | **45%** | Crear/editar/importar falla; suscripción sin catálogo ni pagos reales |
| **Comprador** (dashboard, favoritos, recientes, recomendadas, alertas) | ✅ completa | ⚠️ parcial | **50%** | Favoritos/historial en tablas inexistentes; recientes vía localStorage |
| **Admin** (dashboard, usuarios, propiedades, analytics) | ✅ completa | ❌ roto | **50%** | `auth.users` con anon falla; analytics sobre `listings` |
| **Pagos Stripe** (checkout, boost, webhook, cancelar) | ✅ UI | ⚠️ parcial | **65%** | Webhook OK (`property_boosts`/`seller_profiles` existen); checkout depende de tablas faltantes; sin `stripePriceId` |
| **Importación XML/API** | ✅ mapper completo | ❌ tablas faltantes | **40%** | Escribe en `property_entities`+`listings`; `sync-feeds` es stub |
| **IA** (index-property, búsqueda semántica) | ✅ | ⚠️ columnas viejas | **60%** | `price_type` inexistente; semántica depende de `listings`+pgvector |
| **Notificaciones** (push, alertas, leads) | ✅ | ⚠️ parcial | **55%** | Push simulado (solo `console.log`); `notify-alerts` usa columnas viejas |
| **i18n** (es/en, moneda PYG) | ✅ infraestructura | ❌ **código muerto** | **20%** | `I18nProvider` nunca se monta; selectores sin uso |
| **API pública v1** | ✅ rutas + validación keys | ❌ `listings` | **65%** | Validación real; consultas a tabla inexistente |
| **Middleware / seguridad** | ✅ | ⚠️ | **85%** | Routing por rol completo; admin usa anon |

---

## 3. Bugs críticos — tablas/vistas inexistentes

El esquema SQL (`supabase/schema.sql`) solo crea `agents`, `properties`, `leads` y `seller_profiles`. El código referencia tablas que no existen:

| # | Ubicación | Problema |
|---|---|---|
| 1 | `src/lib/supabase/actions.ts:30,84,98,133` | Consulta la vista `properties_full` (no existe) → rompe listado, destacados y detalle reales |
| 2 | `src/lib/seller/fetch-dashboard.ts:125` | `properties_full` (no existe) → dashboard de vendedor falla |
| 3 | `src/lib/actions/properties.ts:60,75,99,167,180,199,226` | `createListing`/`updateListing` escriben en `property_entities` + `listings` → alta/edición imposible |
| 4 | `src/app/api/import/route.ts:71,84,102` | Importación escribe en `property_entities` + `listings` → falla |
| 5 | `src/lib/supabase/favorites.ts` y `app/comprador/favoritos/page.tsx:18` | Tabla `favorites` inexistente (el DELETE va a `/api/favorites`, ruta que no existe) |
| 6 | `app/comprador/recientes/page.tsx:19` y `app/comprador/recomendadas/page.tsx:17,70-72` | `search_history` inexistente |
| 7 | `vendedor/suscripcion/page.tsx:21` y `api/stripe/checkout/route.ts:22` | `subscription_plans` inexistente → checkout de suscripción imposible |
| 8 | `vendedor/propiedades/[id]/editar/page.tsx:20` | JOIN `listings` inexistente → edición imposible |
| 9 | `api/stripe/boost-checkout/route.ts:24` y `api/stripe/webhook/route.ts:49` | Verifican/actualizan `listings` → boosts pagados no se activan |
| 10 | `app/admin/*` (page, analytics, properties) | `listings` inexistente → panel admin de propiedades/analytics falla |
| 11 | `lib/supabase/analytics-actions.ts:58,72,191` y `boost-actions.ts:44-46` | `listings` con `status`/`image_url` inexistentes |
| 12 | `api/seller/agents/[id]/route.ts:31` | Cuenta `listings` inexistente |

---

## 4. Bugs altos — seguridad / rutas faltantes / columnas viejas

| # | Ubicación | Problema |
|---|---|---|
| 13 | `app/admin/page.tsx:16,30` y `app/admin/users/page.tsx:10` | Consultan `auth.users` con **cliente anon** (sin `service_role`) → PostgREST lo rechaza |
| 14 | `app/auth/reset-password/page.tsx:9` | Form → `/api/auth/reset`; la ruta **no existe** → 404 al enviar |
| 15 | `api/cron/notify-alerts/route.ts:14,45` | Columnas `beds, area, image_url` inexistentes (el schema usa `bedrooms, bathrooms, sqm, image`) |
| 16 | `api/ai/index-property/route.ts:24,46,85` | Columna `price_type` inexistente (el schema usa `type`) |
| 17 | `components/v2/PropertyCard.tsx:15-16,26` | Lee `p.boosted`, `p.operation_type` que no existen en `properties` |
| 18 | `api/push/send/route.ts:35-37` | **Push simulado**: nunca envía nada, solo `console.log` |
| 19 | `(seller)/vendedor/layout.tsx:25` y `components/PublicChrome.tsx:11` | `DemoPageSwitcher` montado **en producción** |
| 20 | `lib/actions/properties.ts:106,186` y `api/import/xml/route.ts:104` | Escriben `operation_type` en tablas que no lo tienen |

---

## 5. Pendientes y código incompleto

- **Migraciones rotas** (fallarían al aplicarse):
  - `supabase/migrations/20260513190000_pgvector_semantic.sql:11-18` → `ALTER TABLE public.listings` (no existe).
  - `supabase/migrations/20260514170000_performance_fixes.sql:9-17` → índices sobre `favorites`/`listings`/`payments` (no existen).
  - `supabase/fix_advisors.sql`, `fix_initplan.sql:62`, `migration_fase4_leads.sql:50,67` → políticas/triggers sobre `listings`.
- **`sync-feeds` es un stub** (`api/cron/sync-feeds/route.ts:65-71`) — la tabla `import_feeds` no existe y hay un TODO explícito.
- **`stripePriceId` vacío** (`lib/stripe/boost-plans.ts:9`) — no hay precios reales de Stripe configurados.
- **Tipos declarados sin tabla real** (`lib/supabase/database.types.ts:578` — `properties_full`).
- **`MIGRACIONES.md` desactualizado** — asume aplicada la vista `properties_full` y columnas que no existen.
- **Fallbacks a mocks** (`src/lib/v2-data.tsx`) — los usuarios ven datos ficticios sin saberlo cuando la consulta real falla.
- **i18n montado en ningún lado** — infraestructura completa pero `I18nProvider` nunca se usa.

---

## 6. Sugerencias priorizadas

### 🔴 P1 — CRÍTICO (desbloquea todo)
1. **Unificar el esquema Supabase.** Decidir UNA fuente de verdad y alinear el código:
   - **Opción A (recomendada):** crear `supabase/migrations/0000_esquema_completo.sql` con `listings` (incl. `status`, `operation_type`, `seller_id`, `seller_profile_id`, `entity_id`, `boosted`, `featured_until`, `external_id`, `source`, `price_type`, `image/images`), `property_entities`, `favorites`, `subscription_plans`, `payments`, `search_history`, `import_feeds` y la vista `properties_full`, migrando datos de `properties` → `listings`.
   - **Opción B:** reescribir las consultas al schema actual de `properties` (perdería funcionalidad v2: boosts, operación venta/alquiler, externo).
2. **Reordenar migraciones** para que `ALTER TABLE listings` (pgvector) e índices (`performance_fixes`) corran después del esquema completo; verificar `supabase db push` desde cero.

### 🟠 P2 — ALTO
3. **Admin:** reemplazar `auth.users` por una RPC `SECURITY DEFINER` (p. ej. `admin_list_users()`) o usar `service_role` — nunca anon.
4. **Crear rutas faltantes:** `/api/auth/reset` (o `supabase.auth.resetPasswordForEmail`) y `/api/favorites` (o DELETE vía cliente con RLS).
5. **Alinear columnas:** `notify-alerts` (→ `bedrooms/bathrooms/sqm/image`) y `ai/index-property` (→ `type`) con el schema real.

### 🟡 P3 — MEDIO
6. **Quitar `DemoPageSwitcher`** de producción o gatearlo por `NODE_ENV`.
7. **Conectar i18n:** montar `<I18nProvider>` en el root layout, o eliminar el módulo.
8. **Push real** con `web-push` + VAPID, o documentar la ruta como mock.

### 🟢 P4 — BAJO
9. Actualizar `MIGRACIONES.md` y las guías (describen un estado que el repo no tiene).
10. Migrar los datos demo de `v2-data.tsx` a seeds reales.

---

## 7. Conclusión

El proyecto es **visual y estructuralmente ambicioso**, pero **no es desplegable ni operativo** hasta resolver la brecha esquema-código. El esfuerzo de corrección se concentra en un solo punto: **crear/aplicar el esquema completo de Supabase** (≈2-3 días) y luego ajustar las consultas admin/auth (≈1-2 días). Con eso, el avance real pasaría de **~55% a ~85%**.

---

## Anexo — Archivos clave

- `supabase/schema.sql` — esquema base real (`agents`, `properties`, `leads`, `seller_profiles`).
- `supabase/migrations/20260513190000_pgvector_semantic.sql` — migración rota (`ALTER TABLE listings`).
- `src/lib/actions/properties.ts` — flujo de alta/edición (mayor consumidor de tablas inexistentes).
- `src/lib/supabase/actions.ts` — consumidor de la vista `properties_full`.
- `middleware.ts` — routing por rol (funcional y completo).
