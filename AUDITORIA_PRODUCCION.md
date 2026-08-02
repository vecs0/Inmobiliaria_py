# 🔍 Auditoría Pre-Producción — InmobiliariaPY V3
> Fecha: 2026-05-20 | Análisis completo de código fuente

---

## 🔴 CRÍTICO — Bugs que bloquean producción

### 1. `xml/route.ts` usa `runtime = 'edge'` pero importa `xml2js` (Node.js)
- **Archivo:** [`src/app/api/import/xml/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/import/xml/route.ts)
- **Problema:** `xml2js` es una librería Node.js pura y **no es compatible con Edge Runtime**. Esto causará un error de build/deploy en Vercel.
- **Fix:** Quitar `export const runtime = 'edge'` de esta ruta, o reemplazar `xml2js` por un parser compatible con Edge (ej. `fast-xml-parser` con bundle ESM).

### 2. `invite-agent/route.ts` usa `runtime = 'edge'` pero importa `@/lib/supabase/server`
- **Archivo:** [`src/app/api/seller/invite-agent/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/seller/invite-agent/route.ts)
- **Problema:** `createClient` de `server.ts` usa `cookies()` de `next/headers`, que **no funciona en Edge Runtime**.
- **Fix:** Quitar `export const runtime = 'edge'` o reescribir sin cookies (usando JWT manual).

### 3. Push subscriptions — tabla `push_subscriptions` no está en el schema
- **Archivo:** [`src/app/api/push/subscribe/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/push/subscribe/route.ts)
- **Problema:** El código hace `.from('push_subscriptions')` pero esta tabla **no aparece en ninguna migración** del directorio `supabase/`. Causará error 500 en producción.
- **Fix:** Crear migración con la tabla `push_subscriptions (id, user_id, subscription jsonb, created_at)` con RLS apropiado.

### 4. Iconos del Service Worker no existen en `/public`
- **Archivo:** [`public/sw.js`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/public/sw.js)
- **Problema:** El SW referencia `/icon-192.png` y `/badge-72.png` que **no existen** en el directorio `public/`. Las notificaciones push mostrarán error de icono.
- **Fix:** Agregar esos archivos PNG al directorio `public/`.

### 5. `agents` tabla — campos de invitación (`invite_token`, `invite_expires_at`, `invited_by`) no están en el schema
- **Archivo:** [`src/app/api/seller/invite-agent/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/seller/invite-agent/route.ts#L104-L111)
- **Problema:** El UPDATE sobre la tabla `agents` usa campos que probablemente no existen en las migraciones SQL. El error silenciado devuelve `updateError` pero expone el fallo.
- **Fix:** Verificar y agregar los campos a la migración de `agents`.

### 6. Checkout usa `NEXT_PUBLIC_SITE_URL` que no está en `.env.example`
- **Archivo:** [`src/app/api/stripe/checkout/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/stripe/checkout/route.ts#L77)
- **Problema:** Usa `process.env.NEXT_PUBLIC_SITE_URL` pero la variable documentada es `NEXT_PUBLIC_APP_URL`. Inconsistencia causa URLs `undefined` en redirect de Stripe.
- **Fix:** Unificar a `NEXT_PUBLIC_APP_URL` en todos los archivos o agregar ambas al `.env.example`.

---

## 🟠 ALTO — Problemas funcionales importantes

### 7. Middleware no protege `/admin/*`
- **Archivo:** [`middleware.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/middleware.ts)
- **Problema:** El middleware solo verifica `/vendedor/*` y `/comprador/*`. Las rutas `/admin/*` **no están protegidas a nivel de Edge**. Solo el layout de admin verifica auth — si hay un bug en el layout, el admin queda expuesto.
- **Fix:** Agregar `const isAdminRoute = pathname.startsWith('/admin')` y redirect a `/auth/login` si no hay usuario.

### 8. Verificación de admin usa `user_metadata.is_admin` — campo no documentado en schema
- **Archivo:** [`src/app/admin/layout.tsx`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/admin/layout.tsx#L18)
- **Problema:** `user.user_metadata?.is_admin === true` no hay trigger ni función en Supabase que setee este campo. Ningún usuario puede ser admin actualmente.
- **Fix:** Agregar el campo `is_admin` al trigger de creación de usuarios, o usar la tabla `profiles` con `role = 'admin'`.

### 9. Roles inconsistentes entre middleware y sistema de roles
- **Problema:** El middleware usa `profiles.role` para detectar admin/agent, pero `role-utils.ts` define roles como `'seller_empresa'` mientras el middleware en `resolveHomePath` busca `profile.role === 'admin'`. La tabla `profiles` usa texto libre — no hay enum ni validación.
- **Fix:** Definir un tipo ENUM en PostgreSQL para el campo `role` y asegurarse de que todos los puntos de acceso usen el mismo valor.

### 10. `SellerShell` — `isEmpresa` siempre `true` por defecto
- **Archivo:** [`src/components/v2/SellerShell.tsx`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/components/v2/SellerShell.tsx#L39)
- **Problema:** El prop `isEmpresa = true` tiene **default `true`**, pero en el layout vendedor se pasa `isEmpresa={isEmpresa}` donde `isEmpresa = userCtx.role === 'seller_empresa'`. El defecto correcto debería ser `false` para evitar mostrar sección Empresa a particulares si se usa el componente sin el prop.
- **Fix:** Cambiar el default a `isEmpresa = false`.

### 11. `cron/notify-alerts` — doble verificación de `emailErr` con numeración duplicada (paso "5")
- **Archivo:** [`src/app/api/cron/notify-alerts/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/cron/notify-alerts/route.ts#L182-L185)
- **Problema:** El código verifica `if (emailErr)` dos veces (líneas 161 y 182). Cuando hay error de email, salta al push y luego **vuelve a chequear `emailErr`** — esto significa que aunque el push funcione, el contador de `notified` nunca incrementa si falló el email. La lógica es correcta pero confusa y puede producir bugs con la actualización del `last_notified_at`.
- **Fix:** Reorganizar el flujo de control para claridad.

### 12. `LandingClient.tsx` — botón "Publicar propiedad" enlaza a ruta inexistente
- **Archivo:** [`src/components/v2/LandingClient.tsx`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/components/v2/LandingClient.tsx#L168)
- **Problema:** El botón CTA apunta a `/vendedor/publicar` pero la ruta real es `/vendedor/propiedades/nueva`.
- **Fix:** Cambiar `href="/vendedor/publicar"` a `href="/vendedor/propiedades/nueva"`.

### 13. Footer tiene links a rutas inexistentes (`/api-docs`, `/terminos`, `/privacidad`, `/cookies`)
- **Archivo:** [`src/components/v2/LandingClient.tsx`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/components/v2/LandingClient.tsx#L299-L312)
- **Problema:** El footer enlaza a `/api-docs`, `/terminos`, `/privacidad` y `/cookies` que **no existen** como páginas en el proyecto. Producen 404.
- **Fix:** Crear páginas placeholder o quitar los links hasta que existan.

### 14. Auth — Login con Google/Apple no implementado
- **Archivo:** [`src/components/v2/LegacyAuthClient.tsx`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/components/v2/LegacyAuthClient.tsx#L329-L332)
- **Problema:** Los botones "Google" y "Apple" en `AuthSocialDivider` son `<button type="button">` sin `onClick`. Son decorativos y no funcionan. Muy mala UX para producción.
- **Fix:** Implementar `supabase.auth.signInWithOAuth({ provider: 'google' })` o quitar los botones.

### 15. `feed-dashboard.ts` — leads no filtran por `seller_id`
- **Archivo:** [`src/lib/seller/fetch-dashboard.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/lib/seller/fetch-dashboard.ts#L117-L121)
- **Problema:** La query de leads no filtra por `seller_id` — todos los vendedores verían **todos los leads** del sistema. Solo el RLS de Supabase evitaría esto, pero no hay certeza de que esté configurado correctamente para leads.
- **Fix:** Agregar `.eq('seller_id', sellerProfileId)` al query de leads, o verificar RLS en la tabla `leads`.

---

## 🟡 MEDIO — Mejoras necesarias antes de producción

### 16. `getCities()` consulta campo `location` pero la vista usa `city`
- **Archivo:** [`src/lib/supabase/actions.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/lib/supabase/actions.ts#L172-L177)
- **Problema:** `getCities()` selecciona `location` de la tabla `properties` pero `mapPropertyFromApi` usa el campo `city`. Inconsistencia puede devolver ciudades vacías.

### 17. `mapPropertyFromApi` — el `id` devuelto es el `external_id`, no el UUID
- **Archivo:** [`src/lib/property-adapter.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/lib/property-adapter.ts#L85)
- **Problema:** `id: String(row.external_id ?? row.id ?? 'PY-0000')` — cuando `external_id` existe, el `id` del objeto V2Property es el external_id, no el UUID. Esto puede causar inconsistencias en favoritos, leads y otras operaciones que esperan UUID.

### 18. Webhook Stripe no maneja `invoice.payment_succeeded` ni `invoice.payment_failed`
- **Archivo:** [`src/app/api/stripe/webhook/route.ts`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/src/app/api/stripe/webhook/route.ts)
- **Problema:** El `switch` solo maneja `checkout.session.completed` y `customer.subscription.deleted`. Los eventos de renovación de suscripción mensual y fallos de pago **no actualizan la DB**, lo que significa que suscripciones pueden quedar activas sin pago o inactivas después de pagar.

### 19. `next.config.mjs` — no configura `images.unoptimized` ni dominios para producción completa
- Falta `placeholder.jpg` referenciado en emails del cron de alertas.
- No hay configuración de `Content-Security-Policy` en headers de Vercel.

### 20. Service Worker — sin estrategia de cache offline real
- **Archivo:** [`public/sw.js`](file:///c:/Users/emman/OneDrive/Documents/Inmobiliaria_py/public/sw.js)
- La estrategia `cache-then-network` actual es muy básica: cachea solo `/`. Para producción debería excluir rutas de API del cache (`/api/*`) para evitar respuestas stale.

### 21. `vercel.json` — región `iad1` (Virginia, USA) puede tener alta latencia desde Paraguay
- Para mejor performance en LATAM se recomienda `gru1` (São Paulo) o `mia1` (Miami).

### 22. `LegacyAuthClient` — sin validación de contraseña mínima en frontend
- El placeholder dice "Mínimo 8 caracteres" pero no hay validación en el handler de registro. Supabase rechazará contraseñas cortas pero el error message llegará en inglés.

### 23. `vercel.json` — falta `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` en variables de entorno
- Las Push Notifications requieren VAPID keys pero no están en `vercel.json` ni en `.env.example`.

---

## 🔵 PÁGINAS FALTANTES (404 en producción)

| Ruta | Referenciada desde | Estado |
|---|---|---|
| `/vendedor/publicar` | LandingClient CTA | ❌ No existe (debería ser `/vendedor/propiedades/nueva`) |
| `/api-docs` | Footer, LandingClient | ❌ No existe |
| `/terminos` | Footer, Auth legal | ❌ No existe |
| `/privacidad` | Footer, Auth legal | ❌ No existe |
| `/cookies` | Footer | ❌ No existe |
| `/auth/invite` | invite-agent email template | ❌ No existe (recibe token de invitación) |
| `/auth/reset-password` | Login form | ❌ No existe (enlace "¿Olvidaste?") |

---

## ✅ LO QUE ESTÁ BIEN

- Middleware base de autenticación por cookies ✅
- SEO dinámico en detalle de propiedad (`generateMetadata`) ✅  
- Estructura de roles `buyer / seller_particular / seller_empresa / admin` ✅
- Stripe webhook con validación de firma ✅
- Fallback de imágenes en `property-adapter.ts` ✅
- Edge runtime en `notify-alerts` (sin deps de Node) ✅
- Security headers en `vercel.json` ✅
- Gestión de cookies en Supabase SSR ✅
- `revalidate = 0` en layout vendedor ✅
- Cancelación suave de suscripción Stripe (`cancel_at_period_end`) ✅

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

### Semana 1 — Bloqueos críticos
1. `xml/route.ts` → quitar `runtime = 'edge'` o cambiar parser
2. `invite-agent/route.ts` → quitar `runtime = 'edge'`  
3. Crear migración `push_subscriptions` table
4. Agregar `icon-192.png` y `badge-72.png` a `/public`
5. Verificar campos `invite_token`, `invite_expires_at` en tabla `agents`
6. Unificar `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL`

### Semana 1 — Seguridad
7. Agregar protección `/admin/*` en middleware.ts
8. Implementar detección de admin via `profiles.role = 'admin'`
9. Verificar RLS en tabla `leads` (filtro por seller)

### Semana 2 — UX/Funcionalidad
10. Corregir link CTA `/vendedor/publicar` → `/vendedor/propiedades/nueva`
11. Crear páginas `/terminos`, `/privacidad`, `/auth/reset-password`, `/auth/invite`
12. Implementar o remover botones Google/Apple OAuth
13. Agregar VAPID keys a `.env.example` y `vercel.json`
14. Manejar eventos Stripe: `invoice.payment_succeeded`, `invoice.payment_failed`

### Semana 2 — Mejoras
15. Cambiar default `isEmpresa = false` en SellerShell
16. Cambiar región Vercel a `gru1` para menor latencia
17. Excluir `/api/*` del cache en Service Worker

---

*Auditoría generada: 2026-05-20 | InmobiliariaPY V3*
