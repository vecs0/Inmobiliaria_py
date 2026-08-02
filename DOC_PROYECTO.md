# DOC_PROYECTO.md — InmobiliariaPY V3
> Documentación técnica viva. Se actualiza automáticamente al completar cada tarea.
> Última actualización: 2026-05-20

---

## 1. DEFINICIÓN GENERAL

**Qué es:** Plataforma inmobiliaria moderna para Paraguay. Permite publicar, buscar y gestionar propiedades con roles diferenciados (comprador, vendedor particular, empresa, admin).

**Para qué:** Centralizar el mercado inmobiliario paraguayo con búsqueda inteligente por IA, pagos integrados, importación masiva XML/CSV y analíticas avanzadas.

**Quiénes lo usan:**
| Rol | Descripción |
|---|---|
| `buyer` | Busca propiedades, guarda favoritos, recibe alertas |
| `seller_particular` | Publica hasta N propiedades, ve métricas y leads |
| `seller_company` | Todo lo anterior + importación XML, API Keys, agentes |
| `admin` | Gestión total de la plataforma |

---

## 2. STACK TECNOLÓGICO Y DECISIONES DE DISEÑO

| Tecnología | Versión | Por qué se eligió |
|---|---|---|
| Next.js App Router | 16 | RSC para SEO + Server Actions sin endpoints explícitos |
| Supabase | latest | PostgreSQL + Auth + Storage + RLS en una sola plataforma |
| Tailwind CSS | 3 | Velocidad de desarrollo + consistencia visual |
| GSAP + Framer Motion | latest | GSAP para cursor/scroll, Framer para transiciones de página |
| Stripe | latest | Checkout hosted (sin PCI) + Webhooks confiables |
| Zustand | latest | Estado global ligero sin boilerplate |
| React Hook Form + Zod | latest | Validación tipada en formularios multi-paso |
| React Leaflet | latest | Mapas sin costo de licencia (OpenStreetMap) |
| OpenAI + pgvector | latest | Búsqueda semántica de propiedades por similitud |
| Resend | latest | Emails transaccionales de alta entregabilidad |

---

## 3. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────┐
│              CLIENTE (Browser)                   │
│  Next.js Client Components + GSAP + Framer       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           NEXT.JS EDGE (Middleware)              │
│  Verificación JWT + Roles → redirect por rol    │
└──────────┬───────────────────────┬──────────────┘
           │                       │
┌──────────▼──────────┐  ┌────────▼────────────────┐
│  React Server       │  │  API Routes              │
│  Components (RSC)   │  │  /api/stripe/*           │
│  Server Actions     │  │  /api/v1/properties      │
│                     │  │  /api/ai/*               │
└──────────┬──────────┘  └────────┬────────────────┘
           │                       │
┌──────────▼───────────────────────▼──────────────┐
│                  SUPABASE                        │
│  PostgreSQL + RLS │ Auth │ Storage │ Edge Fn     │
└──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────┐
│              SERVICIOS EXTERNOS                  │
│  Stripe  │  OpenAI  │  Resend  │  Vercel         │
└──────────────────────────────────────────────────┘
```

---

## 4. MODELO DE DATOS (tablas principales)

```
profiles ──────────── properties ──────── property_boosts
    │                     │
    ├── subscriptions      ├── favorites
    ├── payments           ├── leads
    ├── alerts             ├── search_history
    ├── api_keys           └── (embeddings pgvector)
    └── agents
         └── (vinculados a seller_company)

plans ──── subscriptions (FK plan_id)
```

---

## 5. MÓDULOS IMPLEMENTADOS

> Esta sección se actualiza automáticamente al completar cada tarea.

---

### ✅ Setup inicial — Monorepo + Supabase
- **Archivos clave:** `package.json`, `next.config.mjs`, `tailwind.config.ts`, `supabase/config.toml`
- **Qué hace:** Configura el proyecto base con Next.js 16, Supabase local y Tailwind
- **Migraciones:** `supabase/migrations/` — 10 archivos SQL con esquema completo + RLS

---

### ✅ Autenticación + Middleware de roles
- **Archivos clave:** `src/middleware.ts`, `src/lib/auth/roles.ts`, `src/lib/auth/role-utils.ts`
- **Qué hace:** Intercepta todas las rutas en el Edge, verifica JWT de Supabase, redirige según rol
- **Rutas protegidas:** `/comprador/*` → buyer | `/vendedor/*` → sellers | `/admin/*` → admin

---

### ✅ HOME — LandingClient.tsx
- **Archivos:** `src/app/page.tsx`, `src/components/v2/LandingClient.tsx`
- **Qué hace:** Hero + buscador rápido + propiedades destacadas + recientes
- **Estética:** Glassmorphism + GrainOverlay + CustomCursor + GSAP scroll

---

### ✅ Catálogo de propiedades
- **Archivos:** `src/app/propiedades/page.tsx`, `src/components/v2/ListingClient.tsx`
- **Qué hace:** Listado filtrable (tipo, operación, departamento, precio, dormitorios) + paginación + ordenamiento

---

### ✅ Detalle de propiedad
- **Archivos:** `src/app/propiedades/[id]/page.tsx`, `src/components/v2/DetailClient.tsx`
- **Qué hace:** Galería, mapa Leaflet, info completa, formulario de contacto (genera lead), propiedades similares por IA

---

### ✅ Auth — Registro + Login
- **Archivos:** `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/components/v2/LegacyAuthClient.tsx`
- **Qué hace:** Registro multi-paso con selección de rol. Login con redirect automático por rol.
- **Schemas Zod:** `src/lib/schemas/register-schemas.ts`

---

### ✅ Dashboard Vendedor
- **Archivos:** `src/app/(seller)/vendedor/page.tsx`, `src/components/v2/DashboardClient.tsx`, `src/components/seller/DarkDashboardClient.tsx`
- **Qué hace:** Métricas (vistas, leads, propiedades activas), gráfico de vistas, últimas consultas en tiempo real
- **Hook realtime:** `src/hooks/use-lead-realtime.ts`

---

### ✅ Dashboard Comprador
- **Archivos:** `src/app/comprador/page.tsx`, `src/components/v2/BuyerDashboardClient.tsx`
- **Qué hace:** Panel básico del comprador con acceso a favoritos, alertas e historial

---

### ✅ Boost / Destacar propiedades
- **Archivos:** `src/app/(seller)/vendedor/destacados/`, `src/components/v2/DestacadosV2Client.tsx`
- **Qué hace:** Seleccionar propiedad + plan (7/15/30 días) + pago con Stripe → actualiza `featured_until`
- **Precios:** `src/lib/stripe/boost-plans.ts`

---

### ✅ Gestión de propiedades (vendedor)
- **Archivos:** `src/app/(seller)/vendedor/propiedades/`, `src/components/v2/SellerPropertiesClient.tsx`
- **Qué hace:** Lista propiedades del vendedor + acciones (editar, pausar, destacar) + indicador de límite de plan

---

### ✅ Stripe — Pagos y Suscripciones
- **Archivos:** `src/app/api/stripe/webhook/`, `src/app/api/stripe/checkout/`, `src/app/api/stripe/boost-checkout/`
- **Eventos webhook:** `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

### ✅ Importación XML/CSV
- **Archivos:** `src/app/api/import/`, `src/lib/import/`, `src/lib/deduplication.ts`, `src/lib/property-adapter.ts`
- **Qué hace:** Upload de archivo → parseo → preview de campos → confirmación → INSERT batch en Supabase

---

### ✅ API Keys corporativas
- **Archivos:** `src/app/(seller)/vendedor/api-keys/`, `src/lib/supabase/api-key-actions.ts`, `src/lib/api/validate-key.ts`
- **Qué hace:** Generar key (crypto + bcrypt hash), listar, revocar. La clave se muestra UNA sola vez.

---

### ✅ Analíticas avanzadas (vendedor empresa)
- **Archivos:** `src/app/(seller)/vendedor/analytics/`, `src/lib/supabase/analytics-actions.ts`
- **Qué hace:** Gráficos de vistas por período, tasa de contacto, exportar CSV

---

### ✅ IA — Búsqueda semántica + Recomendaciones
- **Archivos:** `src/app/api/ai/`, `src/lib/openai.ts`, `src/lib/supabase/similar-actions.ts`
- **Qué hace:** Embeddings con OpenAI → almacenados en pgvector → búsqueda por similitud semántica

---

---

### ✅ Favoritos UI — 2026-05-18
- **Archivos creados:** `src/app/comprador/favoritos/page.tsx`, `src/app/comprador/alertas/page.tsx`, `src/app/comprador/recientes/page.tsx`, `src/components/v2/FavoritosClient.tsx`, `src/components/v2/AlertasClient.tsx`, `src/components/v2/RecientesClient.tsx`
- **Modificado:** `src/components/v2/BuyerDashboardClient.tsx` — links actualizados a rutas reales
- **Qué hace:** Panel comprador con tres secciones funcionales: Favoritos (con botón quitar), Alertas (crear/pausar/eliminar con modal), Recientes (últimas 20 propiedades vistas deduplicadas desde search_history)
- **Cómo se usa:** `/comprador/favoritos`, `/comprador/alertas`, `/comprador/recientes` — protegidas por middleware
- **Decisiones técnicas:** JOIN en servidor (favorites → properties, search_history → properties), deduplicación de recientes en el servidor, toggle de alertas sin page reload via Server Action + useTransition
- **Dependencias:** `saved-searches-actions.ts`, `favorites.ts`, `property-adapter.ts`, `getUserContext()`

---

### ✅ Sincronización XML (vendedor empresa) — 2026-05-18
- **Archivos creados:** `src/app/(seller)/vendedor/sincronizacion/page.tsx`, `src/components/v2/SincronizacionClient.tsx`
- **Qué hace:** Panel de configuración de feed XML automático. URL input + selector de frecuencia (manual/diaria/2xdía/horaria) + toggle activo/inactivo. Botón "Sincronizar ahora" llama a `/api/import/xml` con la URL configurada y muestra el resultado. Historial de las últimas 20 sincronizaciones con columnas: fecha, importadas, deduplicadas, errores, estado.
- **Cómo se usa:** `/vendedor/sincronizacion` — sidebar Empresa
- **Decisiones técnicas:** Config de feed (URL, frecuencia, toggle) persiste en `localStorage` del cliente (no hay tabla `sync_config` en el esquema actual). Logs de sincronizaciones se acumulan en memoria/localStorage de la sesión. Solo empresa.
- **Dependencias:** `/api/import/xml`, `getUserContext()`, `SincronizacionClient`

---

### ✅ Agentes (vendedor empresa) — 2026-05-18
- **Archivos creados:** `src/app/(seller)/vendedor/agentes/page.tsx`, `src/components/v2/AgentesClient.tsx`, `src/app/api/seller/agents/route.ts` (GET + POST), `src/app/api/seller/agents/[id]/route.ts` (DELETE)
- **Qué hace:** Lista agentes vinculados a propiedades del seller con card por agente (foto/inicial, nombre, cargo, contacto, cantidad de propiedades). Modal de invitación con campos nombre/email/cargo/teléfono/whatsapp. Eliminar agente desvincula de las propiedades. Solo accesible a `seller_type === 'empresa'`.
- **Cómo se usa:** `/vendedor/agentes` — sidebar Empresa
- **Decisiones técnicas:** Los agentes se almacenan en tabla `agents` y se vinculan a `properties.agent_id`. Eliminar = desvincular (no borrar el agente del catálogo). Límite de agentes tomado de `seller_profiles.max_agents`.
- **Dependencias:** `agents` table, `properties.agent_id`, `/api/seller/agents`

---

### ✅ Importar XML/CSV UI (vendedor empresa) — 2026-05-18
- **Archivos creados:** `src/app/(seller)/vendedor/importar/page.tsx`, `src/components/v2/ImportarClient.tsx`
- **Modificado:** `src/components/v2/SellerShell.tsx` — sección "Empresa" con links a Importar / Agentes / Sincronización
- **Qué hace:** Flujo en 3 pasos: (1) upload drag&drop o URL de feed XML, (2) llama `/api/import/xml` → muestra preview de propiedades encontradas con tabla de muestra, (3) confirma → POST a `/api/import` con batch completo → muestra log de resultado (importadas / deduplicadas / errores). Solo accesible para `seller_type === 'empresa'`.
- **Cómo se usa:** `/vendedor/importar` — link en sidebar sección Empresa
- **Dependencias:** `/api/import/xml`, `/api/import`, `getUserContext()` para verificar rol empresa

---

### ✅ Perfil vendedor — 2026-05-18
- **Archivos creados:** `src/app/(seller)/vendedor/perfil/page.tsx`, `src/components/v2/PerfilVendedorClient.tsx`
- **Modificados:** `src/lib/actions/seller.ts` (acción `updateSellerProfile()`), `src/components/v2/SellerShell.tsx` (link "Mi perfil" en sidebar)
- **Qué hace:** Panel de edición de perfil con: avatar (upload a `/api/seller/upload`), nombre, teléfono. Para empresas: nombre comercial, RUC, sitio web. Guarda en `profiles` y `seller_profiles` en paralelo.
- **Cómo se usa:** `/vendedor/perfil` — accesible desde sidebar "Mi perfil"
- **Dependencias:** `updateSellerProfile()`, `/api/seller/upload`, tablas `profiles` + `seller_profiles`

---

### ✅ Editar propiedad (vendedor) — 2026-05-18
- **Archivos creados:** `src/app/(seller)/vendedor/propiedades/[id]/editar/page.tsx`
- **Modificados:** `src/components/v2/NuevaPropertyClient.tsx` (props opcionales `listingId` + `initialData`), `src/lib/actions/properties.ts` (acción `updateListing()`), `src/components/v2/SellerPropertiesClient.tsx` (botón "Editar" por fila)
- **Qué hace:** Precarga los datos de la propiedad existente, reutiliza el formulario multi-paso con `listingId` y en el submit llama `updateListing()` en lugar de `createListing()`. Verifica que el listing pertenezca al vendedor autenticado.
- **Cómo se usa:** `/vendedor/propiedades/{id}/editar` — link "Editar" en cada fila de la tabla
- **Dependencias:** `updateListing()`, `listings` + `property_entities` tables JOIN, `NuevaPropertyClient`

---

### ✅ Recomendadas IA (comprador) — 2026-05-18
- **Archivos creados:** `src/app/comprador/recomendadas/page.tsx`, `src/components/v2/RecomendadasClient.tsx`
- **Qué hace:** Muestra propiedades recomendadas personalizadas. Estrategia en cascada: (1) toma la última propiedad vista del `search_history`, (2) llama `getSimilarProperties()` con pgvector+fallback, (3) si no hay suficientes, completa con destacadas activas, (4) finalmente con las más recientes.
- **Cómo se usa:** `/comprador/recomendadas` — protegida por layout del comprador
- **Decisiones técnicas:** 3 niveles de fallback para garantizar contenido siempre visible. Excluye propiedades ya vistas de las recomendaciones.
- **Dependencias:** `getSimilarProperties()`, `search_history` table, `properties`, `mapPropertiesFromApi()`

---

### ✅ Layout + Sidebar comprador — 2026-05-18
- **Archivos creados:** `src/app/comprador/layout.tsx`, `src/components/v2/CompradorSidebar.tsx`
- **Qué hace:** Layout tipo shell con sidebar fijo para el panel del comprador. Sidebar con links a Inicio, Recomendadas, Favoritos, Alertas y Recientes. Footer con links a catálogo y panel vendedor.
- **Cómo se usa:** Se aplica automáticamente a todas las rutas bajo `/comprador/*`
- **Decisiones técnicas:** Mismo patrón visual que `SellerShell` (dash-shell / dash-sidebar / dash-main CSS classes), Server Component para el layout (verifica auth), Client Component para sidebar (necesita `usePathname`)
- **Dependencias:** `@/lib/supabase/server`, `v2-styles.css` (clases dash-*)

---

## 6. PENDIENTES

```
---
---

### ✅ Suscripción UI (vendedor) — 2026-05-18
- **Archivos creados:** `src/components/v2/SuscripcionClient.tsx`, `src/app/api/stripe/cancel-subscription/route.ts`
- **Modificado:** `src/app/(seller)/vendedor/suscripcion/page.tsx` — reescrito como Server Component
- **Qué hace:** Panel completo de suscripción con: (1) tarjeta plan actual con barra de uso de propiedades y estado badge, (2) grid de planes disponibles con Stripe Checkout, (3) historial de pagos con tabla (monto, plan, estado, período), (4) cancelación con modal de confirmación — cancela al fin del período vía `cancel_at_period_end: true`
- **Cómo se usa:** `/vendedor/suscripcion` — datos cargados server-side, cancelación via POST `/api/stripe/cancel-subscription`
- **Decisiones técnicas:** Server Component para carga inicial (3 queries en paralelo), Client Component solo para interacciones. Cancelación soft (Stripe `cancel_at_period_end`) para no cortar acceso inmediatamente.
- **Dependencias:** `subscription_plans`, `seller_profiles`, `payments` tables; `/api/stripe/checkout`; `stripe.subscriptions.update()`

---

### ✅ Correcciones críticas Pre-Producción (Sprint 4) — 2026-05-20
- **Archivos creados:** `public/icon-192.png`, `public/badge-72.png`, `supabase/migrations/20260520101700_push_subscriptions_and_agents.sql`
- **Modificados:** `middleware.ts`, `src/app/admin/layout.tsx`, `src/app/api/cron/notify-alerts/route.ts`, Edge Functions, `fetch-dashboard.ts`
- **Qué hace:** Estabilización completa antes del lanzamiento en producción.
- **Detalles:**
  - Se removió dependencias de Node.js incompatibles con Edge Runtime (`xml2js`).
  - Se blindó la seguridad en `/admin/*` usando `middleware.ts` y verificando `profiles.role`.
  - Refactorización de manejo de errores independientes (email vs push) en CRON jobs.
  - Corrección de consultas para evitar data-leaks en leads.
  - Esquema SQL completo con la nueva tabla `push_subscriptions`.

---

## 6. PENDIENTES

```
🔲 Alertas push notifications (Service Worker)
🔲 Historial recientes UI — localStorage fallback sin login
```

---

## 7. INSTALACIÓN Y EJECUCIÓN

```bash
# Clonar y preparar
git clone [repo]
cd inmobiliaria-py
cp .env.example .env.local   # completar variables

# Instalar dependencias
npm install

# Base de datos local
npx supabase start
npx supabase db push

# Desarrollo
npm run dev          # → http://localhost:3000

# Seed de usuarios de prueba
node scripts/seed-demo-users.mjs
```

**Variables de entorno requeridas:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 8. CONCLUSIONES Y DECISIONES TÉCNICAS

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Supabase RLS en DB | Validación solo en API | Seguridad garantizada aunque se acceda directo a la DB |
| pgvector para IA | Servicio externo de vectores | Sin latencia de red, mismo PostgreSQL |
| App Router RSC | Pages Router | SEO nativo + carga más rápida sin JS extra al cliente |
| Leaflet (free) | Google Maps | Sin costo de API, suficiente para Paraguay |
| Stripe hosted checkout | Stripe Elements custom | Sin PCI compliance propio, más seguro |

---

*Documento generado y mantenido automáticamente por el agente de desarrollo.*
*Para consultar el estado actual: preguntar `STATUS` al agente.*
