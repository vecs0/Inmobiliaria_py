# 🏠 InmobiliariaPY

> Plataforma inmobiliaria moderna para Paraguay.
> **Fecha de inicio del proyecto:** 03/05/2026 · Estado actual: en desarrollo (~55%)

## 📌 Descripción

**InmobiliariaPY** es una plataforma web inmobiliaria para el mercado paraguayo que permite publicar, buscar y gestionar propiedades con roles diferenciados: **comprador**, **vendedor particular**, **vendedor empresa** y **administrador**.

Incluye búsqueda inteligente asistida por IA, pagos integrados (Stripe), importación masiva de propiedades (XML/CSV), notificaciones push, analíticas avanzadas, favoritos, alertas, comparación de inmuebles, i18n (español/inglés con moneda PYG/USD) y una API pública con validación de API keys.

## ⚙️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 · React 19 |
| Estilos | Tailwind CSS 3 · shadcn/ui · framer-motion · GSAP |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Pagos | Stripe |
| IA | OpenAI (indexado y búsqueda semántica, pgvector) |
| Mapas | Leaflet / react-leaflet |
| Notificaciones | Web Push (service worker) |
| Importación | XML (xml2js) · CSV · ClosedXML |
| Estado | Zustand · react-hook-form + Zod |

## 🚀 Scripts

```bash
npm install          # instalar dependencias
npm run dev          # desarrollo (Next + webpack)
npm run build        # build de producción
npm run start        # servidor de producción
npm run lint         # ESLint
npm run seed:demo    # sembrar usuarios demo
```

## 🗂️ Estructura

```
src/
├── app/                    # Páginas y rutas API (App Router)
│   ├── (seller)/vendedor/  # Panel del vendedor
│   ├── admin/              # Panel de administración
│   ├── comprador/          # Panel del comprador
│   ├── auth/               # Login, registro, reset
│   ├── api/                # 22 rutas API (Stripe, import, IA, cron, push…)
│   └── propiedades/        # Listado y detalle público
├── components/             # UI y componentes de cada rol
├── hooks/                  # use-lead-realtime, use-recent-views…
├── lib/                    # supabase, stripe, openai, i18n, store, utils
└── legacy-ui/              # Prototipo original (V1/V2)
```

## 🧩 Módulos principales

- **Publicación de propiedades** con venta/alquiler, boosts y destacados.
- **Búsqueda por IA** (semántica + pgvector) y filtros por zona/ciudad/precio.
- **Panel vendedor:** propiedades, agentes, importación XML/CSV, sincronización de feeds, suscripción, perfil, API keys.
- **Panel comprador:** favoritos, recientes, recomendadas, alertas, comparador.
- **Panel admin:** usuarios, propiedades, analíticas, configuración.
- **Pagos Stripe:** suscripciones y boosts con webhook.
- **Notificaciones push** y alertas por búsquedas guardadas.
- **API pública v1** (`/api/v1/properties`) con validación de API keys.

## 📋 Estado del proyecto

| Área | Avance |
|---|---|
| Frontend / UI | ≈ 85% |
| Backend de datos | ≈ 40% |
| **Global** | **≈ 55%** |

> El proyecto está en desarrollo activo. Consulta [`EVALUACION_PROYECTO.md`](./EVALUACION_PROYECTO.md) para el análisis completo de avance, bugs, pendientes y sugerencias priorizadas.

## 📄 Documentación

- [`EVALUACION_PROYECTO.md`](./EVALUACION_PROYECTO.md) — auditoría técnica, % de avance, bugs y sugerencias.
- [`DOC_PROYECTO.md`](./DOC_PROYECTO.md) — documentación técnica viva del proyecto.
- [`AUDITORIA_PRODUCCION.md`](./AUDITORIA_PRODUCCION.md) — auditoría de producción (2026-05-20).
- [`supabase/MIGRACIONES.md`](./supabase/MIGRACIONES.md) — historial de migraciones de la base de datos.

## 🔒 Notas

- Las variables de entorno se configuran en `.env.local` (usa `.env.example` como plantilla). **Nunca subas `.env.local` con secretos.**
- Requiere cuenta de Supabase, claves de OpenAI, Stripe y credenciales de web push para funcionar por completo.
