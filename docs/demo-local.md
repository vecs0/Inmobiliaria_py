# Demo local

## Qué es

La demo de InmobiliariaPY son cinco cuentas de prueba, dos perfiles de vendedor y cinco
inmuebles que se crean **solo** al recrear la base local con `supabase db reset`. Nunca se
siembra fuera de local: el archivo de sembrado empieza con una guardia que, antes de
escribir nada, calcula una **huella heurística del entorno** (sesión privilegiada,
superusuario o rol con `BYPASSRLS` —en Supabase local el reset corre como `postgres`— conexión desde loopback o red privada y el secreto JWT por defecto que solo configura la CLI de Supabase en local). Si no puede confirmar las
cuatro condiciones, **aborta el reset con un error** y no deja ningún dato de demo: es un
fallo cerrado (*fail-closed*), el comportamiento esperado y no un bug. La huella es una
heurística, no una garantía criptográfica; no existe parámetro para forzarla (para
saltarla habría que editar el archivo).

## Cómo recrearla

Con el stack local de Supabase disponible:

```bash
supabase start     # solo si el stack no está levantado
supabase db reset  # aplica migraciones + seed.sql + seeds/demo.sql
```

Es un solo paso y no hay script manual. El sembrado es **idempotente**: se puede volver a
correr sin duplicar cuentas, perfiles ni inmuebles; lo que ya existe con los ids de la demo
se omite y solo se completa lo que falta. Hay dos salvedades, y las dos son "informar y no
tocar" (RF-16/RF-15), pero **no terminan igual**:

- **Un correo de demo ocupado por otra cuenta** (otro id): se informa y esa cuenta no se
  toca, así que la cuenta demo no existe. El cierre del sembrado **aborta** porque falta una
  de las cinco cuentas: el reset queda en rojo con el mensaje de qué falta.
- **Una publicación demo a nombre de otro dueño**: se informa y no se reasigna ni se
  modifica. El reset **puede terminar en verde** con ese aviso en la salida.

El aborto por publicaciones ocurre cuando **falta** alguna de las cinco por `external_id`
(no por tener otro dueño). Nunca queda una demo a medias en silencio: o termina en error, o
deja el aviso visible en la salida del reset.

## Cuentas de prueba

| Correo | Contraseña | Rol | Qué se puede probar |
|---|---|---|---|
| `comprador@demo.inmobiliaripy.py` | `Demo2026!` | comprador (`user`) | Catálogo público y fichas de inmuebles. Sus paneles de comprador arrancan vacíos (ver "Qué NO trae la demo"). |
| `vendedor.particular@demo.inmobiliaripy.py` | `Demo2026!` | vendedor particular (`seller`) | Panel del vendedor con 2 inmuebles propios: 1 `active` y 1 `pending`. |
| `empresa@demo.inmobiliaripy.py` | `Demo2026!` | vendedor empresa (`seller_empresa`) | Panel del vendedor con 3 inmuebles: 2 `active` y 1 `paused`; perfil con plan `pro`. |
| `agente@demo.inmobiliaripy.py` | `Demo2026!` | agente (`agent`) | Inicio de sesión con el rol `agent` reconocido. No tiene panel propio ni vínculo con filas de `agents`. |
| `admin@demo.inmobiliaripy.py` | `Demo2026!` | administrador (`admin`) | Inicio de sesión con rol de administrador. |

**Destinos tras el login:** admin y agente inician sesión **como hoy**: el producto los
manda a `/vendedor`, igual que a las cuentas vendedoras. Con la cuenta admin, `/admin`
se alcanza **navegando** a esa ruta; no hay redirección especial y este comportamiento no
se modifica en esta spec.

## Qué trae la demo

### Inmuebles

Los cinco inmuebles se reparten entre las dos cuentas vendedoras. La moneda es USD, la
operación es `venta` salvo donde se indica, y todos comparten `parking = 2`, amenities
`{Piscina, Garage, Jardín}` y una imagen de demostración.

| `external_id` | Título | Dueño | Estado | Destacada | Precio (USD) |
|---|---|---|---|---|---|
| PY-0241 | Residencia con jardín en Villa Morra [DEMO] | empresa | `active` | sí | 485.000 (venta) |
| PY-0188 | Penthouse en Carmelitas [DEMO] | empresa | `active` | sí | 312.000 (venta) |
| PY-0099 | Casa de campo en San Bernardino [DEMO] | empresa | `paused` | sí | 425.000 (venta) |
| PY-0317 | Casa minimalista con piscina [DEMO] | particular | `active` | no | 268.000 (venta) |
| PY-0402 | Loft urbano frente a la Costanera [DEMO] | particular | `pending` | no | 1.800 (alquiler) |

El catálogo público muestra las publicaciones `active` (PY-0241, PY-0188 y PY-0317); la
`paused` y la `pending` se ven en el panel de su dueño. Las tres destacadas son PY-0241,
PY-0188 y PY-0099 (en la portada se ven las que además están activas).

### Perfiles de vendedor

| Cuenta | Tipo | Plan | Estado | Límites |
|---|---|---|---|---|
| empresa | `empresa` | `pro` | `active` | 50 propiedades, 3 agentes |
| vendedor particular | `particular` | `trial` | `active` | 5 propiedades, 0 agentes |

El contador de propiedades de cada perfil se recalcula al final del sembrado y equivale al
total de publicaciones del perfil, sin filtrar por estado (empresa: 3, particular: 2).

### Agentes de referencia

Los tres agentes de `supabase/seed.sql` (Lic. Carolina Mendez, Dr. Rodrigo Villalba y Arq.
Valentina Torres) se mantienen como datos de referencia. Los inmuebles demo se vinculan a
ellos de forma informativa para que la ficha pública muestre contacto; ese vínculo **no**
asocia cuentas ni accesos.

## Qué NO trae la demo

- Sin consultas ni mensajes entre comprador y vendedor.
- Sin favoritos, búsquedas guardadas, alertas, recientes ni comparador.
- Sin pagos ni suscripciones reales de Stripe, y sin boosts comprados (los planes de los
  perfiles son solo datos de prueba).
- Sin contenido de IA (embeddings, búsqueda semántica, recomendaciones).

Si se quiere probar algo de esto, se genera a mano durante la sesión; el sembrado no lo
crea y no lo va a completar.

## Credencial de laboratorio

`Demo2026!` es una contraseña de **laboratorio**: compartida y versionada a propósito, como
excepción deliberada y aprobada (NFR-3). Vale **solo** para estas cinco cuentas en la base
local, que no contienen datos reales. Está prohibido reutilizarla en cuentas reales, en un
entorno desplegado o en cualquier servicio externo.

## Cómo reconocer la demo

- Las cuentas usan el dominio `@demo.inmobiliaripy.py` y sus ids empiezan con `d0000000-`.
- Las propiedades se reconocen por **dos** marcas (NFR-4): el título termina en
  `[DEMO]` (p. ej. `Residencia con jardín en Villa Morra [DEMO]`) y la descripción
  empieza con `[DEMO] `, con el formato
  `[DEMO] <título sin la marca> en <barrio>, <ciudad>. Propiedad de demostración.`
  La marca aparece una sola vez en cada campo (nunca `[DEMO] … [DEMO]`).
- Los `external_id` de los inmuebles son PY-0241, PY-0188, PY-0099, PY-0317 y PY-0402.

## Fuente única

Toda la demo está definida en **`supabase/seeds/demo.sql`**, que `supabase db reset` ejecuta
después de `supabase/seed.sql`. Si cambian las cuentas, los inmuebles o sus datos, se cambia
ahí; no hay otra vía de sembrado.
