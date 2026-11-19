-- InmobiliariaPY V3 — Sembrado de DEMO (spec 001, RF-11/RF-12/RF-18/NFR-5)
-- ============================================================================
-- Se ejecuta con `supabase db reset`, DESPUÉS de `supabase/seed.sql` (agentes de
-- referencia), según el orden de `[db.seed] sql_paths` en `supabase/config.toml`.
--
-- Este archivo es la ÚNICA definición de los datos de demostración (RF-2).
-- T1 aporta la GUARDIA de entorno; T2 agrega las 5 cuentas de prueba y sus
-- identidades de Auth; T3 fija los roles reales y los perfiles de vendedor;
-- T4 siembra las 5 entidades y las 5 publicaciones. T5 completa destacadas y
-- agentes; T6 los contadores de vendedor.
--
-- --- Qué es la "huella de entorno local" (plan 001 §3) ----------------------
-- El CLI de Supabase no ofrece una señal oficial de "estoy en local" legible
-- desde SQL, así que la guardia evalúa una huella de instancia que solo se
-- cumple en el stack local:
--
--   1. sesión privilegiada  -> el usuario de la sesión no es `anon` ni
--      `authenticated` (es el dueño de la base, `postgres`).
--   2. `is_superuser = 'on'` -> el `postgres` del contenedor local.
--      OJO: esta condición DEBE confirmarse con un `supabase db reset` real
--      (T1, verificación manual). Si el `postgres` local no fuera superusuario,
--      la guardia bloquearía la demo en local (falso negativo: molesto pero
--      seguro) y habría que reemplazarla por otra propiedad exclusiva del
--      contenedor, dejando constancia acá mismo.
--   3. `inet_client_addr()` es loopback o RFC1918 -> el reset llega desde la
--      máquina del desarrollador o desde la red interna de Docker:
--      127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, ::1/128.
--
-- --- Por qué falla cerrado --------------------------------------------------
-- Si cualquiera de los tres valores es nulo o desconocido, la huella NO se
-- considera local y el sembrado ABORTA antes de escribir (RF-11). En
-- particular, si `inet_client_addr()` viniera nulo (conexión por socket unix
-- dentro del contenedor), eso cuenta como "no confirmable" y aborta; el
-- `RAISE NOTICE` de diagnóstico muestra el valor para poder ajustarlo.
--
-- La huella es una HEURÍSTICA, no una garantía criptográfica: un Supabase
-- autoalojado en una red privada cuyo `postgres` sea superusuario también la
-- cumpliría. Es el límite conocido y aceptado al no existir señal oficial
-- (plan 001 §3, "Límite reconocido").
--
-- --- Sin bypass -------------------------------------------------------------
-- No hay parámetros, variables de sesión ni interruptor que permita forzar la
-- escritura: para saltar la guardia hay que editar este archivo (intencional).
-- Aborta con EXCEPTION (reset en ROJO con mensaje explícito), no con un aviso:
-- una base sin demo nunca debe parecer un sembrado exitoso (RF-12).
--
-- --- Revalidación por bloque (invocador que ignora el error) ------------------
-- Que la guardia aborte no alcanza si quien ejecuta el archivo IGNORA el error:
-- `psql -f` sin `ON_ERROR_STOP` sigue con la sentencia siguiente y escribiría la
-- demo. Por eso la huella vive en UNA sola función temporal de sesión
-- (`pg_temp.demo_require_local()`, definida abajo) y **cada bloque que escribe**
-- la vuelve a evaluar como PRIMERA sentencia de su `DO`:
--
--     PERFORM pg_temp.demo_require_local();
--
-- Si el entorno no es local, todos los bloques abortan en su primera línea: no
-- se inserta ninguna cuenta, perfil, publicación ni vínculo. Falla cerrado.
-- La definición es única (la guardia y los bloques invocan la MISMA función), así
-- que el predicado no puede divergir entre la guardia y las revalidaciones.
-- ============================================================================

-- Única definición de la huella de entorno local. Es una función TEMPORAL de la
-- sesión: no deja objetos en ningún esquema ni escribe datos de demo, y
-- desaparece al cerrar la conexión del sembrado.
CREATE OR REPLACE FUNCTION pg_temp.demo_require_local() RETURNS void
LANGUAGE plpgsql AS $demo_huella_local$
DECLARE
  v_current_user        text  := current_user;
  v_is_superuser        text  := current_setting('is_superuser', true);
  v_client_addr         inet  := inet_client_addr();
  v_sesion_privilegiada boolean;
  v_superusuario        boolean;
  v_cliente_local       boolean;
  v_secreto_local       boolean;
  v_huella_local        boolean;
BEGIN
  -- 1) Sesión privilegiada: requisito para poder escribir en `auth.*` y en
  --    tablas con RLS. `anon`/`authenticated` nunca son entorno de sembrado.
  v_sesion_privilegiada :=
        v_current_user IS NOT NULL
    AND v_current_user NOT IN ('anon', 'authenticated');

  -- 2) Rol con privilegios de administración: superusuario ('on') o un rol con
  --    BYPASSRLS. En el Supabase local, `supabase db reset` siembra como
  --    `postgres`, que NO es superusuario (is_superuser=off) pero sí tiene
  --    BYPASSRLS; exigir solo superusuario hacía que la guardia abortara siempre.
  --    Cualquier otro caso => NO confirmado (falla cerrado).
  v_superusuario := (coalesce(v_is_superuser, '') = 'on')
                 OR coalesce((SELECT r.rolbypassrls FROM pg_roles r WHERE r.rolname = current_user), false);

  -- 3) Origen de la conexión: loopback o RFC1918. Nulo => NO confirmado.
  --    (Si aparece un rango IPv4 mapeado a IPv6, p. ej. `::ffff:172.17.0.1`,
  --    el NOTICE lo muestra y la guardia aborta: ajustar acá si el reset real
  --    se conecta así.)
  v_cliente_local :=
        v_client_addr IS NOT NULL
    AND (
          v_client_addr << inet '127.0.0.0/8'
       OR v_client_addr << inet '10.0.0.0/8'
       OR v_client_addr << inet '172.16.0.0/12'
       OR v_client_addr << inet '192.168.0.0/16'
       OR v_client_addr << inet '::1/128'
    );

  -- 4) Marca exclusiva del Supabase LOCAL: la CLI configura el secreto JWT
  --    público y por defecto. Un proyecto alojado tiene un secreto propio (o no
  --    expone el parámetro), así que esta condición falla ahí aunque el rol
  --    tenga BYPASSRLS y la conexión llegue desde una IP privada del pooler.
  v_secreto_local := coalesce(current_setting('app.settings.jwt_secret', true), '')
                   = 'super-secret-jwt-token-with-at-least-32-characters-long';

  -- La huella solo es verdadera si se cumplen las CUATRO condiciones.
  v_huella_local :=
        v_sesion_privilegiada
    AND v_superusuario
    AND v_cliente_local
    AND v_secreto_local;

  -- Diagnóstico para quien mira la salida del reset (T1): los tres valores
  -- evaluados y el veredicto. `coalesce(..., '<NULL>')` evita confundir un
  -- valor ausente con una cadena vacía. Se emite también en cada revalidación
  -- de bloque, así el diagnóstico sigue siendo visible línea a línea.
  RAISE NOTICE
    'demo(guardia): current_user=%, is_superuser=%, inet_client_addr=%, secreto_jwt_local=%, huella_local=%',
    coalesce(v_current_user, '<NULL>'),
    coalesce(v_is_superuser, '<NULL>'),
    coalesce(v_client_addr::text, '<NULL>'),
    v_secreto_local,
    v_huella_local;

  IF v_huella_local IS NOT TRUE THEN
    RAISE EXCEPTION
      'demo: entorno no local o no confirmable — no se sembró ningún dato de demostración'
      USING HINT = 'La demo solo se siembra en el entorno local de Supabase '
                   '(sesión privilegiada + superusuario o BYPASSRLS + conexión loopback/RFC1918 '
                   '+ secreto JWT por defecto de la CLI). '
                   'No existe parámetro para forzar la escritura.';
  END IF;
END;
$demo_huella_local$;

-- Guardia: primera sentencia ejecutable del archivo. Sin huella local aborta
-- acá, antes de que se cree o escriba cualquier dato de demo (RF-11/RF-12). La
-- comprobación está en la función de arriba para que exista una sola definición
-- del predicado; los bloques de escritura la vuelven a invocar (revalidación).
DO $demo_guardia$
BEGIN
  PERFORM pg_temp.demo_require_local();

  RAISE NOTICE
    'demo(guardia): entorno local confirmado; la guardia no sembró datos (T1).';
END;
$demo_guardia$;

-- ============================================================================
-- T2.0 — CREDENCIALES DE LA DEMO: UNA SOLA DEFINICIÓN (RF-6, NFR-3)
-- ----------------------------------------------------------------------------
-- Los correos, los ids y la contraseña de laboratorio se definen SOLO acá.
-- T2.2 crea las cuentas a partir de estas filas y el aviso final del sembrado
-- (T6) las vuelve a leer para imprimirlas: lo que muestra la salida del reset
-- no puede desincronizarse de lo que realmente se sembró (RF-6).
--
-- Se usan tablas TEMPORALES de sesión (`demo_credenciales` y `demo_parametros`):
-- no dejan objetos en ningún esquema y desaparecen al cerrar la conexión del
-- sembrado. `TRUNCATE` + `INSERT` mantienen la idempotencia si el archivo se
-- ejecutara dos veces en la misma sesión.
-- ============================================================================
-- Se envuelve en un bloque DO porque la CLI de Supabase envía el seed como un
-- lote: fuera de PL/pgSQL, el TRUNCATE/INSERT se analizaban antes de que
-- existiera la tabla temporal y el reset fallaba con "relation does not exist".
DO $demo_credenciales$
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS demo_credenciales (
    rol          text PRIMARY KEY,
    user_id      uuid NOT NULL UNIQUE,
    email        text NOT NULL,
    full_name    text,
    company_name text,
    ruc          text
  );
  TRUNCATE demo_credenciales;
  INSERT INTO demo_credenciales (rol, user_id, email, full_name, company_name, ruc) VALUES
    ('user',           'd0000000-0000-4000-8000-000000000001'::uuid, 'comprador@demo.inmobiliaripy.py',           'Carolina Compradora', NULL::text,                   NULL::text),
    ('seller',         'd0000000-0000-4000-8000-000000000002'::uuid, 'vendedor.particular@demo.inmobiliaripy.py', 'Juan Particular',     NULL::text,                   NULL::text),
    ('seller_empresa', 'd0000000-0000-4000-8000-000000000003'::uuid, 'empresa@demo.inmobiliaripy.py',             'Andrés Martínez',     'Inmobiliaria del Este S.A.', '80012345-6'),
    ('agent',          'd0000000-0000-4000-8000-000000000004'::uuid, 'agente@demo.inmobiliaripy.py',              'Agente Demo',         NULL::text,                   NULL::text),
    ('admin',          'd0000000-0000-4000-8000-000000000005'::uuid, 'admin@demo.inmobiliaripy.py',               'Administrador Demo',  NULL::text,                   NULL::text);

  CREATE TEMP TABLE IF NOT EXISTS demo_parametros (
    clave text PRIMARY KEY,
    valor text NOT NULL
  );
  TRUNCATE demo_parametros;
  -- NFR-3: contraseña de LABORATORIO compartida por las 5 cuentas, acotada al
  -- entorno local por la guardia de arriba. No se reutiliza en cuentas reales ni
  -- en servicios externos.
  INSERT INTO demo_parametros (clave, valor) VALUES ('password', 'Demo2026!');
END
$demo_credenciales$;

-- ============================================================================
-- T2 — CUENTAS DE PRUEBA E IDENTIDADES DE ACCESO (RF-3, RF-5, RF-16, NFR-1, NFR-3)
-- ----------------------------------------------------------------------------
-- Las 5 cuentas se crean en el ÁREA DE USUARIOS DE AUTH (`auth.users`) y no con
-- `public.profiles`: el login por contraseña lo resuelve el servicio de Auth, y
-- un perfil sin fila de usuario no puede iniciar sesión. `profiles` y
-- `seller_profiles` NO se escriben acá: los crea el trigger `on_auth_user_created`
-- (`public.handle_new_user`, migración 20261017000400), exactamente como en un
-- alta real. No se duplica su lógica.
--
-- Contraseña: `Demo2026!`, la credencial de LABORATORIO aprobada (NFR-3). Se
-- guarda hasheada con bcrypt de pgcrypto; es una excepción acotada al entorno
-- local (la guardia de arriba impide sembrar fuera de local) y no tiene relación
-- con credenciales de servicios ni con datos reales.
--
-- Constantes de la demo (mismo criterio que `seed.sql`: ids literales para no
-- depender de defaults ni de índices únicos que no existen). Los ids llevan el
-- prefijo `d0000000-…` para reconocerlos como filas de demostración. Las
-- credenciales y los ids de las 5 cuentas se definen en el bloque T2.0.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- T2.1 — Preflight del esquema de Auth (RF-18)
-- ----------------------------------------------------------------------------
-- Antes de escribir, se comprueba que existan las tablas, columnas y funciones
-- que el INSERT va a tocar. Si el esquema de Auth cambiara entre versiones de
-- GoTrue, el sembrado aborta con un mensaje claro en español en vez de fallar
-- con un error críptico a mitad de la inserción.
--
-- Nota: un correo que ya exista con OTRO id no aborta acá; se informa y se omite
-- esa cuenta en el bloque siguiente (RF-16: informar y no tocar), para que el
-- resto de la demo sí se siembre.
DO $demo_preflight_cuentas$
DECLARE
  v_problemas   text[] := ARRAY[]::text[];
  v_faltantes   text;
  -- Columnas que el INSERT de abajo escribe sí o sí.
  v_cols_users  text[] := ARRAY[
    'instance_id', 'id', 'aud', 'role', 'email', 'encrypted_password',
    'confirmation_token', 'recovery_token', 'email_change_token_new', 'email_change',
    'email_confirmed_at', 'raw_app_meta_data', 'raw_user_meta_data',
    'created_at', 'updated_at'
  ];
  v_cols_ident  text[] := ARRAY[
    'id', 'user_id', 'identity_data', 'provider', 'provider_id',
    'last_sign_in_at', 'created_at', 'updated_at'
  ];
BEGIN
  -- Revalidación de la guardia: primera sentencia, antes de cualquier lectura o
  -- escritura (cubre a un invocador que ignoró el error de la guardia). Falla
  -- cerrado: si el entorno no es local, el bloque no pasa de acá.
  PERFORM pg_temp.demo_require_local();

  -- 1) Tablas del área de Auth.
  IF to_regclass('auth.users') IS NULL THEN
    v_problemas := v_problemas || 'no existe la tabla auth.users'::text;
  END IF;
  IF to_regclass('auth.identities') IS NULL THEN
    v_problemas := v_problemas || 'no existe la tabla auth.identities'::text;
  END IF;

  -- 2) Funciones de hash: el baseline crea pgcrypto en el esquema `extensions`.
  IF to_regprocedure('extensions.crypt(text,text)') IS NULL THEN
    v_problemas := v_problemas || 'no existe extensions.crypt(text,text)'::text;
  END IF;
  IF to_regprocedure('extensions.gen_salt(text)') IS NULL THEN
    v_problemas := v_problemas || 'no existe extensions.gen_salt(text)'::text;
  END IF;

  -- 3) Columnas mínimas de auth.users.
  IF to_regclass('auth.users') IS NOT NULL THEN
    SELECT string_agg(req.col, ', ') INTO v_faltantes
      FROM unnest(v_cols_users) AS req(col)
     WHERE NOT EXISTS (
       SELECT 1
         FROM information_schema.columns c
        WHERE c.table_schema = 'auth'
          AND c.table_name   = 'users'
          AND c.column_name  = req.col
     );
    IF v_faltantes IS NOT NULL THEN
      v_problemas := v_problemas || format('a auth.users le faltan columnas: %s', v_faltantes);
    END IF;

    -- Ninguna columna NOT NULL sin default puede quedar sin valor. Si una
    -- versión de GoTrue agregara una, se aborta con la lista (no se adivina un
    -- valor). Se ignoran generadas e identidad, que el motor completa solas.
    SELECT string_agg(c.column_name, ', ' ORDER BY c.column_name) INTO v_faltantes
      FROM information_schema.columns c
     WHERE c.table_schema   = 'auth'
       AND c.table_name     = 'users'
       AND c.is_nullable    = 'NO'
       AND c.column_default IS NULL
       AND c.is_generated   = 'NEVER'
       AND c.is_identity    = 'NO'
       AND c.column_name <> ALL (v_cols_users);
    IF v_faltantes IS NOT NULL THEN
      v_problemas := v_problemas ||
        format('auth.users tiene columnas NOT NULL sin default que el sembrado no completa: %s', v_faltantes);
    END IF;
  END IF;

  -- 4) Columnas mínimas de auth.identities (la tabla varía entre versiones;
  --    NO se escribe `email`, que es columna generada en las versiones nuevas).
  IF to_regclass('auth.identities') IS NOT NULL THEN
    SELECT string_agg(req.col, ', ') INTO v_faltantes
      FROM unnest(v_cols_ident) AS req(col)
     WHERE NOT EXISTS (
       SELECT 1
         FROM information_schema.columns c
        WHERE c.table_schema = 'auth'
          AND c.table_name   = 'identities'
          AND c.column_name  = req.col
     );
    IF v_faltantes IS NOT NULL THEN
      v_problemas := v_problemas || format('a auth.identities le faltan columnas: %s', v_faltantes);
    END IF;

    SELECT string_agg(c.column_name, ', ' ORDER BY c.column_name) INTO v_faltantes
      FROM information_schema.columns c
     WHERE c.table_schema   = 'auth'
       AND c.table_name     = 'identities'
       AND c.is_nullable    = 'NO'
       AND c.column_default IS NULL
       AND c.is_generated   = 'NEVER'
       AND c.is_identity    = 'NO'
       AND c.column_name <> ALL (v_cols_ident);
    IF v_faltantes IS NOT NULL THEN
      v_problemas := v_problemas ||
        format('auth.identities tiene columnas NOT NULL sin default que el sembrado no completa: %s', v_faltantes);
    END IF;
  END IF;

  IF array_length(v_problemas, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'demo(cuentas): preflight fallido — %', array_to_string(v_problemas, '; ')
      USING HINT = 'El sembrado de demo espera el esquema de Auth del stack local de Supabase (GoTrue) '
                   'y pgcrypto en el esquema extensions. No se insertó ninguna cuenta: revisá la '
                   'versión del CLI/Supabase o ajustá supabase/seeds/demo.sql.';
  END IF;

  RAISE NOTICE 'demo(cuentas): preflight OK — auth.users, auth.identities y pgcrypto(extensions) disponibles.';
END;
$demo_preflight_cuentas$;

-- ----------------------------------------------------------------------------
-- T2.2 — Alta de las 5 cuentas y de su identidad de proveedor email
-- ----------------------------------------------------------------------------
-- Idempotencia (RF-13/RF-16): si el correo ya existe con NUESTRO id se omite;
-- si existe con OTRO id se informa y no se toca esa cuenta; si no existe se
-- inserta. `ON CONFLICT DO NOTHING` queda como red de seguridad.
DO $demo_cuentas$
DECLARE
  v_password  text;  -- NFR-3: se lee de demo_parametros (definición única, T2.0)
  v_cuenta    record;
  v_existente uuid;
  v_creadas   integer := 0;
  v_omitidas  integer := 0;
  v_ajenas    integer := 0;
BEGIN
  -- Revalidación de la guardia: primera sentencia, antes de cualquier INSERT.
  PERFORM pg_temp.demo_require_local();

  -- La contraseña de laboratorio tiene una sola definición (bloque T2.0): si
  -- faltara, se aborta antes de crear una cuenta sin poder iniciar sesión.
  SELECT p.valor INTO v_password
    FROM demo_parametros p
   WHERE p.clave = 'password';
  IF v_password IS NULL THEN
    RAISE EXCEPTION 'demo(cuentas): falta la contraseña de laboratorio en demo_parametros';
  END IF;

  -- Las 5 cuentas también tienen una sola definición (bloque T2.0), la misma
  -- que reimprime el aviso final del sembrado (RF-6).
  FOR v_cuenta IN
    SELECT c.rol, c.user_id AS id, c.email, c.full_name, c.company_name, c.ruc
      FROM demo_credenciales c
     ORDER BY c.user_id
  LOOP
    v_existente := NULL;
    SELECT u.id INTO v_existente
      FROM auth.users u
     WHERE lower(u.email) = v_cuenta.email
     ORDER BY u.created_at
     LIMIT 1;

    IF v_existente IS NULL THEN
      -- Fila de usuario. `raw_user_meta_data.role` es la clave que lee
      -- `handle_new_user`. Para admin/agente el trigger degrada el rol a 'user'
      -- a propósito (lista blanca, NFR-2); T3 los ajusta después, en sesión
      -- privilegiada. `email_confirmed_at` deja la cuenta confirmada (RF-3) y
      -- `confirmed_at` NO se escribe: es columna generada del esquema de Auth.
      -- Los cuatro tokens (confirmation/recovery/email_change*) van en '' porque
      -- GoTrue los lee como `string` de Go: en NULL el login revienta con
      -- "Database error querying schema". Sus índices únicos son parciales y
      -- excluyen la cadena vacía, así que no chocan entre cuentas.
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_cuenta.id,
        'authenticated',
        'authenticated',
        v_cuenta.email,
        extensions.crypt(v_password, extensions.gen_salt('bf')),
        '',
        '',
        '',
        '',
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_strip_nulls(jsonb_build_object(
          'role',           v_cuenta.rol,
          'full_name',      v_cuenta.full_name,
          'company_name',   v_cuenta.company_name,
          'ruc',            v_cuenta.ruc,
          'email',          v_cuenta.email,
          'email_verified', true
        )),
        now(),
        now()
      );
      v_creadas := v_creadas + 1;
      RAISE NOTICE 'demo(cuentas): creada % (%)', v_cuenta.email, v_cuenta.id;
    ELSIF v_existente = v_cuenta.id THEN
      v_omitidas := v_omitidas + 1;
      RAISE NOTICE 'demo(cuentas): % ya existe con el id esperado (%); no se reinserta',
        v_cuenta.email, v_cuenta.id;
    ELSE
      v_ajenas := v_ajenas + 1;
      RAISE NOTICE 'demo(cuentas): el correo % ya existe con otro id (%); no se crea ni se modifica esa cuenta',
        v_cuenta.email, v_existente;
      CONTINUE;  -- no se toca la identidad de una cuenta ajena
    END IF;

    -- Identidad del proveedor email: sin esta fila el login por contraseña no
    -- encuentra la identidad. `provider_id` = id del usuario; `identity_data`
    -- lleva `sub` y `email`. NO se escribe la columna `email` de identities:
    -- en las versiones nuevas es generada; se completa el resto solo si falta.
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      v_cuenta.id,
      jsonb_build_object(
        'sub',            v_cuenta.id::text,
        'email',          v_cuenta.email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_cuenta.id::text,
      NULL,
      now(),
      now()
    WHERE NOT EXISTS (
      SELECT 1
        FROM auth.identities i
       WHERE i.user_id  = v_cuenta.id
         AND i.provider = 'email'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE 'demo(cuentas): resumen — creadas=%, ya existentes=%, con otro id (no tocadas)=%',
    v_creadas, v_omitidas, v_ajenas;
END;
$demo_cuentas$;

-- ============================================================================
-- T3 — ROLES REALES Y PERFILES DE VENDEDOR (RF-3, RF-4, RF-14, NFR-2)
-- ----------------------------------------------------------------------------
-- `handle_new_user` (migración 20261017000400) aplica una LISTA BLANCA de roles
-- leída del metadata del alta: solo `user|seller|seller_empresa`; `admin` y
-- `agent` se degradan a `user` A PROPÓSITO (NFR-2: un alta normal nunca concede
-- admin). Por eso el rol real de esas dos cuentas se corrige acá, DESPUÉS del
-- alta, y solo puede hacerlo una sesión privilegiada:
-- `guard_profiles_privileged_cols` y `guard_seller_profiles`
-- (20261017000100_security_hardening.sql) devuelven NEW sin cambios cuando
-- `is_privileged_session()` es verdadero, o sea cuando `current_user` no es
-- `anon` ni `authenticated`. La sesión del sembrado (`postgres` del stack local)
-- cumple esa condición; el alta normal de una persona no. No se tocan triggers,
-- políticas ni RLS: se usa el mismo camino que ya prevén los guards.
--
-- Con los `seller_profiles` pasa igual: el trigger los crea en `trial`/`inactive`
-- con `max_properties = 5` (empresa: `max_agents = 3`); acá se llevan a los
-- valores que la demo ya definía:
--   empresa:    plan `pro`,   estado `active`, max_properties 50, max_agents 3
--   particular: plan `trial`, estado `active`, max_properties 5,  max_agents 0
-- `properties_count` NO se toca acá: lo recalcula T6.
--
-- Idempotente (RF-13/RF-14): todos los UPDATE van scoped por **id literal** y
-- filtran por valor distinto, así que re-ejecutar no modifica filas. Ningún
-- criterio usa el correo: si una cuenta ajena ocupara un correo de demo, T2 la
-- omitió y acá no hay fila propia que tocar (solo se informa, RF-16).
-- ============================================================================
DO $demo_roles_perfiles$
DECLARE
  v_cuenta             record;
  v_rol_actual         text;
  v_otro_id            uuid;
  v_problemas          text[] := ARRAY[]::text[];
  v_desvios            text;
  v_filas              integer;
  v_roles_cambiados    integer := 0;
  v_perfiles_ajustados integer := 0;
BEGIN
  -- Revalidación de la guardia: primera sentencia, antes de cualquier UPDATE.
  PERFORM pg_temp.demo_require_local();

  -- 1) Preflight (RF-18): este bloque da por sentado que T2 insertó las cuentas
  --    y que el trigger de alta dejó su `profile` (y su `seller_profile` cuando
  --    corresponde). Si esa suposición se rompió, se aborta ANTES de escribir.
  FOR v_cuenta IN
    SELECT *
      FROM (VALUES
        ('user',           'd0000000-0000-4000-8000-000000000001'::uuid, 'comprador@demo.inmobiliaripy.py',           'user'::text,           false),
        ('seller',         'd0000000-0000-4000-8000-000000000002'::uuid, 'vendedor.particular@demo.inmobiliaripy.py', 'seller'::text,         true),
        ('seller_empresa', 'd0000000-0000-4000-8000-000000000003'::uuid, 'empresa@demo.inmobiliaripy.py',             'seller_empresa'::text, true),
        ('agent',          'd0000000-0000-4000-8000-000000000004'::uuid, 'agente@demo.inmobiliaripy.py',              'agent'::text,          false),
        ('admin',          'd0000000-0000-4000-8000-000000000005'::uuid, 'admin@demo.inmobiliaripy.py',               'admin'::text,          false)
      ) AS t(etiqueta, id, email, rol_esperado, es_vendedor)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_cuenta.id) THEN
      -- La cuenta demo no existe con su id literal. Dos causas posibles:
      --   a) T2 la omitió porque el correo ya lo usa otra cuenta → informativo
      --      y sin cambios (RF-16);
      --   b) el alta no se hizo → rompe la suposición del sembrado (RF-18).
      v_otro_id := NULL;
      SELECT u.id INTO v_otro_id
        FROM auth.users u
       WHERE lower(u.email) = v_cuenta.email
         AND u.id <> v_cuenta.id
       ORDER BY u.created_at
       LIMIT 1;
      IF v_otro_id IS NOT NULL THEN
        RAISE NOTICE 'demo(roles): % no se siembra: el correo % lo usa otra cuenta (%); no se toca (RF-16)',
          v_cuenta.etiqueta, v_cuenta.email, v_otro_id;
      ELSE
        v_problemas := v_problemas ||
          format('%s (%s) no existe en auth.users', v_cuenta.email, v_cuenta.id);
      END IF;
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_cuenta.id) THEN
      v_problemas := v_problemas ||
        format('%s (%s) no tiene fila en public.profiles: el trigger handle_new_user no corrió',
               v_cuenta.email, v_cuenta.id);
      CONTINUE;
    END IF;

    IF v_cuenta.es_vendedor
       AND NOT EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.user_id = v_cuenta.id) THEN
      v_problemas := v_problemas ||
        format('%s (%s) no tiene seller_profile: el trigger handle_new_user no lo creó',
               v_cuenta.email, v_cuenta.id);
      CONTINUE;
    END IF;

    -- Los tres roles que el trigger SÍ concede no se reescriben: si no coinciden
    -- con lo esperado, la fila se tocó fuera del sembrado y RF-16 pide informar,
    -- no corregir.
    IF v_cuenta.rol_esperado NOT IN ('agent', 'admin') THEN
      SELECT p.role::text INTO v_rol_actual FROM public.profiles p WHERE p.id = v_cuenta.id;
      IF v_rol_actual IS DISTINCT FROM v_cuenta.rol_esperado THEN
        RAISE NOTICE 'demo(roles): % (%): rol % distinto del esperado %; no se modifica (RF-16)',
          v_cuenta.email, v_cuenta.id, v_rol_actual, v_cuenta.rol_esperado;
      END IF;
    END IF;
  END LOOP;

  IF array_length(v_problemas, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'demo(roles): no se pudieron fijar los roles y perfiles — %',
      array_to_string(v_problemas, '; ')
      USING HINT = 'El sembrado asume que T2 insertó las 5 cuentas en auth.users y que el trigger '
                   'handle_new_user creó public.profiles (y el seller_profile de cada vendedora). '
                   'No se aplicó ningún cambio de rol ni de perfil de vendedor.';
  END IF;

  -- 2) Rol real de agente y admin. El trigger los dejó en `user` (lista blanca);
  --    esta sesión es privilegiada, así que `guard_profiles_privileged_cols` la
  --    deja pasar. Scoped por id literal: nunca por correo ni por rol actual.
  UPDATE public.profiles
     SET role = 'agent'::public.user_role,
         updated_at = now()
   WHERE id = 'd0000000-0000-4000-8000-000000000004'
     AND role IS DISTINCT FROM 'agent'::public.user_role;
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  v_roles_cambiados := v_roles_cambiados + v_filas;

  UPDATE public.profiles
     SET role = 'admin'::public.user_role,
         updated_at = now()
   WHERE id = 'd0000000-0000-4000-8000-000000000005'
     AND role IS DISTINCT FROM 'admin'::public.user_role;
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  v_roles_cambiados := v_roles_cambiados + v_filas;

  -- 3) Perfiles de vendedor con los valores de la demo. Scoped por el id de cada
  --    vendedora y solo si algún valor difiere (re-ejecutar no toca nada).
  --    Particular: el script viejo no pasaba plan, así que quedaba el default
  --    `trial`; estado `active`, límite 5 y sin agentes.
  UPDATE public.seller_profiles
     SET seller_type         = 'particular',
         subscription_plan   = 'trial',
         subscription_status = 'active',
         max_properties      = 5,
         max_agents          = 0,
         updated_at          = now()
   WHERE user_id = 'd0000000-0000-4000-8000-000000000002'
     AND (seller_type         IS DISTINCT FROM 'particular'
       OR subscription_plan   IS DISTINCT FROM 'trial'
       OR subscription_status IS DISTINCT FROM 'active'
       OR max_properties      IS DISTINCT FROM 5
       OR max_agents          IS DISTINCT FROM 0);
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  v_perfiles_ajustados := v_perfiles_ajustados + v_filas;

  -- Empresa: plan `pro`, estado `active`, 50 propiedades y 3 agentes.
  UPDATE public.seller_profiles
     SET seller_type         = 'empresa',
         subscription_plan   = 'pro',
         subscription_status = 'active',
         max_properties      = 50,
         max_agents          = 3,
         updated_at          = now()
   WHERE user_id = 'd0000000-0000-4000-8000-000000000003'
     AND (seller_type         IS DISTINCT FROM 'empresa'
       OR subscription_plan   IS DISTINCT FROM 'pro'
       OR subscription_status IS DISTINCT FROM 'active'
       OR max_properties      IS DISTINCT FROM 50
       OR max_agents          IS DISTINCT FROM 3);
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  v_perfiles_ajustados := v_perfiles_ajustados + v_filas;

  -- 4) Verificación del resultado. Si un guard hubiera revertido el cambio en
  --    silencio (no debería: la sesión es privilegiada), se aborta en vez de
  --    dar por buena una demo incompleta.
  SELECT string_agg(format('%s tiene rol %s (esperado %s)', e.email, p.role::text, e.rol_esperado), '; ')
    INTO v_desvios
    FROM (VALUES
      ('d0000000-0000-4000-8000-000000000004'::uuid, 'agente@demo.inmobiliaripy.py', 'agent'::text),
      ('d0000000-0000-4000-8000-000000000005'::uuid, 'admin@demo.inmobiliaripy.py',  'admin'::text)
    ) AS e(id, email, rol_esperado)
    JOIN public.profiles p ON p.id = e.id
   WHERE p.role::text IS DISTINCT FROM e.rol_esperado;

  IF v_desvios IS NOT NULL THEN
    RAISE EXCEPTION 'demo(roles): el ajuste de rol no quedó aplicado — %', v_desvios
      USING HINT = 'La sesión del sembrado debe ser privilegiada para guard_profiles_privileged_cols '
                   '(is_privileged_session(): current_user NOT IN (anon, authenticated)). '
                   'No se resuelve aflojando el guard.';
  END IF;

  SELECT string_agg(
           format('%s quedó con tipo=%s plan=%s estado=%s max_properties=%s max_agents=%s',
                  e.email, sp.seller_type, sp.subscription_plan, sp.subscription_status,
                  sp.max_properties, sp.max_agents), '; ')
    INTO v_desvios
    FROM (VALUES
      ('d0000000-0000-4000-8000-000000000002'::uuid, 'vendedor.particular@demo.inmobiliaripy.py', 'particular'::text, 'trial'::text, 'active'::text, 5,  0),
      ('d0000000-0000-4000-8000-000000000003'::uuid, 'empresa@demo.inmobiliaripy.py',             'empresa'::text,    'pro'::text,   'active'::text, 50, 3)
    ) AS e(user_id, email, tipo, plan, estado, max_props, max_agents)
    JOIN public.seller_profiles sp ON sp.user_id = e.user_id
   WHERE sp.seller_type         IS DISTINCT FROM e.tipo
      OR sp.subscription_plan   IS DISTINCT FROM e.plan
      OR sp.subscription_status IS DISTINCT FROM e.estado
      OR sp.max_properties      IS DISTINCT FROM e.max_props
      OR sp.max_agents          IS DISTINCT FROM e.max_agents;

  IF v_desvios IS NOT NULL THEN
    RAISE EXCEPTION 'demo(roles): el perfil de vendedor no quedó con los valores de la demo — %', v_desvios
      USING HINT = 'La sesión del sembrado debe ser privilegiada para guard_seller_profiles. '
                   'No se resuelve aflojando el guard.';
  END IF;

  -- Informativo: una cuenta no vendedora del sembrado con seller_profile no se
  -- borra (no se toca lo que este bloque no creó); se avisa para que se note.
  SELECT string_agg(p.email, ', ')
    INTO v_desvios
    FROM public.seller_profiles sp
    JOIN public.profiles p ON p.id = sp.user_id
   WHERE sp.user_id IN (
     'd0000000-0000-4000-8000-000000000001'::uuid,
     'd0000000-0000-4000-8000-000000000004'::uuid,
     'd0000000-0000-4000-8000-000000000005'::uuid
   );
  IF v_desvios IS NOT NULL THEN
    RAISE NOTICE 'demo(roles): hay seller_profiles inesperados en cuentas no vendedoras (%); no se modifican',
      v_desvios;
  END IF;

  -- Resumen legible para quien mira la salida del reset.
  SELECT string_agg(format('%s=%s', p.email, p.role::text), ', ' ORDER BY p.email)
    INTO v_desvios
    FROM public.profiles p
   WHERE p.id IN (
     'd0000000-0000-4000-8000-000000000001'::uuid,
     'd0000000-0000-4000-8000-000000000002'::uuid,
     'd0000000-0000-4000-8000-000000000003'::uuid,
     'd0000000-0000-4000-8000-000000000004'::uuid,
     'd0000000-0000-4000-8000-000000000005'::uuid
   );
  RAISE NOTICE 'demo(roles): filas modificadas — roles=%, perfiles_vendedor=%; roles finales: %',
    v_roles_cambiados, v_perfiles_ajustados, coalesce(v_desvios, '<sin perfiles demo>');
END;
$demo_roles_perfiles$;

-- ============================================================================
-- T4 — ENTIDADES Y PUBLICACIONES REPARTIDAS (RF-7, RF-10, RF-13, RF-14, RF-15)
-- ----------------------------------------------------------------------------
-- Se siembra el catálogo canónico completo: 5 `property_entities` (la entidad
-- física deduplicada) y 5 `listings` (la publicación comercial), con los datos
-- que la demo ya definía (documentados en `docs/demo-local.md`).
--
-- --- Reparto acordado (plan 001 §5) -----------------------------------------
--   3 publicaciones de la vendedora EMPRESA y 2 del vendedor PARTICULAR, para
--   que el panel de cada uno tenga contenido (RF-7), con estados distintos
--   (RF-10: 3 `active`, 1 `pending`, 1 `paused`):
--
--   | external_id | Título                                   | Vendedor   | Estado   |
--   |-------------|------------------------------------------|------------|----------|
--   | PY-0241     | Residencia con jardín en Villa Morra     | empresa    | active   |
--   | PY-0188     | Penthouse en Carmelitas                  | empresa    | active   |
--   | PY-0099     | Casa de campo en San Bernardino          | empresa    | paused   |
--   | PY-0317     | Casa minimalista con piscina             | particular | active   |
--   | PY-0402     | Loft urbano frente a la Costanera        | particular | pending  |
--
-- --- Ids literales -----------------------------------------------------------
-- Mismo criterio que las cuentas y los agentes: ids fijos para no depender de
-- defaults ni de índices únicos que no existen.
--   entidades:    e0000000-0000-4000-8000-00000000000N (N = 1..5, en el orden
--                 de la tabla de arriba)
--   publicaciones:10000000-0000-4000-8000-00000000000N (mismo N)
-- El `seller_profile_id` NO es literal: lo genera el trigger `handle_new_user`,
-- así que se busca por el `user_id` literal de cada vendedora (nunca por email).
--
-- --- Qué se escribe y qué no ------------------------------------------------
--   * `featured` y `agent_id` NO se escriben: quedan con su default
--     (`false` / NULL). Los completa T5 (destacadas + agentes de referencia),
--     que es la tarea que verifica que el guard no las revierta.
--   * `properties_count` NO se toca: lo recalcula T6.
--   * Nada de UPDATE/DELETE: solo `INSERT ... SELECT ... WHERE NOT EXISTS`,
--     así una fila ajena (una publicación cargada a mano en QA) queda intacta
--     (RF-15).
--
-- --- Título y descripción marcados como demostración (NFR-4) ----------------
-- La descripción conserva el texto original del script viejo
-- (`<título> en <barrio>, <ciudad>. Propiedad de demostración.`) y lleva el
-- prefijo visible `[DEMO] `. El título se guarda con el sufijo ` [DEMO]`
-- (`Residencia con jardín en Villa Morra [DEMO]`), armado desde el título base
-- para que la marca aparezca UNA sola vez en cada campo: el catálogo muestra el
-- título, no la descripción, y NFR-4 pide las dos. El DDL tiene un campo `tag`,
-- pero es una etiqueta comercial que la UI muestra como distintivo de la
-- publicación; usarlo para marcar la demo falsearía ese dato.
--
-- --- Idempotencia (RF-13/RF-14) ---------------------------------------------
-- Doble red: `ON CONFLICT (id) DO NOTHING` (id literal) y `NOT EXISTS` por
-- `external_id` (el script viejo insertó estos mismos inmuebles SIN índice
-- único en `external_id`, así que una base ya poblada no debe duplicarlos).
-- La entidad solo se inserta si su publicación no existe: no deja entidades
-- huérfanas cuando la publicación ya estaba.
--
-- --- Datos del catálogo ------------------------------------------------------
-- `parking = 2`, `currency = 'USD'`, `source = 'direct'`, precio en `numeric`,
-- `sqm` en `numeric`, `images`/`amenities` como arrays de texto; amenities
-- `{Piscina, Garage, Jardín}` como en el script viejo. `floor`, `year_built`,
-- `latitude` y `longitude` quedan NULL: el script viejo no los define y no se
-- inventan datos (la vista `properties_full` los expone, pero son opcionales).
-- El título de PY-0402 se escribe "frente a la Costanera" como fija el plan;
-- el script viejo tenía un error de tipeo ("frente al Costanera").
-- ============================================================================
DO $demo_entidades_publicaciones$
DECLARE
  v_particular uuid;
  v_empresa    uuid;
  v_prop       record;
  v_seller_id  uuid;
  v_filas      integer;
  v_nuevas     integer := 0;
  v_omitidas   integer := 0;
  v_total      integer;
  v_resumen    text;
BEGIN
  -- Revalidación de la guardia: primera sentencia, antes de cualquier INSERT.
  PERFORM pg_temp.demo_require_local();

  -- 1) Preflight (RF-18): las publicaciones se reparten entre los dos perfiles
  --    de vendedor que creó T3. Se buscan por `user_id` literal (el id del
  --    perfil lo genera el trigger). Si falta alguno, no se puede cumplir el
  --    reparto: se aborta ANTES de escribir.
  SELECT sp.id INTO v_particular
    FROM public.seller_profiles sp
   WHERE sp.user_id = 'd0000000-0000-4000-8000-000000000002';
  SELECT sp.id INTO v_empresa
    FROM public.seller_profiles sp
   WHERE sp.user_id = 'd0000000-0000-4000-8000-000000000003';

  IF v_particular IS NULL OR v_empresa IS NULL THEN
    RAISE EXCEPTION
      'demo(propiedades): falta el seller_profile de una vendedora demo (particular=%, empresa=%)',
      coalesce(v_particular::text, '<NULL>'), coalesce(v_empresa::text, '<NULL>')
      USING HINT = 'El sembrado asume que T3 dejó un seller_profile por vendedora '
                   '(user_id d0000000-…-0002 y d0000000-…-0003). No se insertó ninguna entidad ni publicación.';
  END IF;

  -- 2) Una sola definición de los 5 inmuebles (datos del catálogo viejo).
  --    Se recorre en el orden del reparto para que el NOTICE sea legible.
  FOR v_prop IN
    SELECT *
      FROM (VALUES
        (1, 'PY-0241'::text,
         'e0000000-0000-4000-8000-000000000001'::uuid,
         '10000000-0000-4000-8000-000000000001'::uuid,
         'empresa'::text, 'Casa'::text,
         'Residencia con jardín en Villa Morra'::text,
         'Villa Morra'::text, 'Asunción'::text,
         485000::numeric, 'venta'::text, 'active'::text,
         4::integer, 3::integer, 328::numeric,
         'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'::text),
        (2, 'PY-0188',
         'e0000000-0000-4000-8000-000000000002',
         '10000000-0000-4000-8000-000000000002',
         'empresa', 'Penthouse',
         'Penthouse en Carmelitas',
         'Carmelitas', 'Asunción',
         312000, 'venta', 'active',
         3, 2, 185,
         'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'),
        (3, 'PY-0099',
         'e0000000-0000-4000-8000-000000000003',
         '10000000-0000-4000-8000-000000000003',
         'empresa', 'Casa',
         'Casa de campo en San Bernardino',
         'San Bernardino', 'San Bernardino',
         425000, 'venta', 'paused',
         5, 4, 410,
         'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'),
        (4, 'PY-0317',
         'e0000000-0000-4000-8000-000000000004',
         '10000000-0000-4000-8000-000000000004',
         'particular', 'Casa',
         'Casa minimalista con piscina',
         'Trinidad', 'Asunción',
         268000, 'venta', 'active',
         4, 3, 240,
         'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'),
        (5, 'PY-0402',
         'e0000000-0000-4000-8000-000000000005',
         '10000000-0000-4000-8000-000000000005',
         'particular', 'Apartamento',
         'Loft urbano frente a la Costanera',
         'Centro', 'Asunción',
         1800, 'alquiler', 'pending',
         2, 2, 120,
         'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80')
      ) AS t(orden, external_id, entity_id, listing_id, vendedor, tipo,
             titulo, barrio, ciudad, precio, operacion, estado,
             dormitorios, banos, sqm, imagen)
     ORDER BY t.orden
  LOOP
    v_seller_id := CASE WHEN v_prop.vendedor = 'empresa'
                        THEN v_empresa
                        ELSE v_particular
                   END;

    -- 2a) Entidad física. Solo si su publicación no existe ya (ni por id
    --     literal ni por `external_id`): así una base sembrada por el script
    --     viejo no gana entidades huérfanas (RF-13/RF-15).
    INSERT INTO public.property_entities (
      id, type, city, neighborhood,
      bedrooms, bathrooms, parking, sqm
    )
    SELECT
      v_prop.entity_id,
      v_prop.tipo,
      v_prop.ciudad,
      v_prop.barrio,
      v_prop.dormitorios,
      v_prop.banos,
      2,                -- parking = 2, como en el script viejo
      v_prop.sqm
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.listings l
       WHERE l.external_id = v_prop.external_id
          OR l.id = v_prop.listing_id
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2b) Publicación comercial. `NOT EXISTS` por `external_id` protege el caso
    --     "base ya poblada"; `ON CONFLICT (id)` cubre el id literal. No se
    --     escriben `featured` (default false, T5) ni `agent_id` (NULL, T5).
    INSERT INTO public.listings (
      id, entity_id, seller_profile_id,
      title, description, price, currency, operation_type, status,
      image, images, amenities, source, external_id
    )
    SELECT
      v_prop.listing_id,
      v_prop.entity_id,
      v_seller_id,
      -- NFR-4: el título lleva la marca como sufijo (`<título base> [DEMO]`)
      -- y la descripción como prefijo. El título base de arriba NO la trae,
      -- así cada campo queda marcado una sola vez (nunca `[DEMO] … [DEMO]`).
      v_prop.titulo || ' [DEMO]',
      -- NFR-4: prefijo visible + texto original del script viejo (título base).
      '[DEMO] ' || v_prop.titulo || ' en ' || v_prop.barrio || ', ' || v_prop.ciudad
        || '. Propiedad de demostración.',
      v_prop.precio,
      'USD',
      v_prop.operacion,
      v_prop.estado,
      v_prop.imagen,
      ARRAY[v_prop.imagen]::text[],
      ARRAY['Piscina', 'Garage', 'Jardín']::text[],
      'direct',
      v_prop.external_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.listings l WHERE l.external_id = v_prop.external_id
    )
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    IF v_filas > 0 THEN
      v_nuevas := v_nuevas + 1;
      RAISE NOTICE 'demo(propiedades): creada % — % [DEMO] (%) para % en estado %',
        v_prop.external_id, v_prop.titulo, v_prop.listing_id, v_prop.vendedor, v_prop.estado;
    ELSE
      v_omitidas := v_omitidas + 1;
      RAISE NOTICE 'demo(propiedades): % ya existe (%); no se reinserta ni se modifica',
        v_prop.external_id, v_prop.listing_id;
    END IF;
  END LOOP;

  -- 3) Verificación del resultado (RF-18): las 5 publicaciones deben existir
  --    con su `external_id`, cada una con su entidad (FK NOT NULL) y su
  --    vendedor. Si falta alguna, se aborta en vez de dejar una demo a medias.
  SELECT count(*) INTO v_total
    FROM public.listings l
   WHERE l.external_id IN ('PY-0241', 'PY-0188', 'PY-0099', 'PY-0317', 'PY-0402');

  IF v_total < 5 THEN
    RAISE EXCEPTION 'demo(propiedades): solo quedaron % de 5 publicaciones de demo', v_total
      USING HINT = 'No se borra ni se corrige nada automáticamente (RF-15). Revisá los NOTICE '
                   'previos: una publicación con el mismo `external_id` que pertenezca a otra '
                   'cuenta bloquea la inserción.';
  END IF;

  IF v_total > 5 THEN
    -- Duplicados de una base ya poblada: no se tocan (RF-15), solo se avisa.
    RAISE NOTICE 'demo(propiedades): hay % publicaciones con los `external_id` de demo (esperado 5); no se modifica ninguna',
      v_total;
  END IF;

  -- Aviso (sin corregir): publicaciones demo que quedaron a nombre de un perfil
  -- que no es de las dos vendedoras demo (p. ej. filas del script viejo o una
  -- cuenta que ocupaba el correo). RF-15: informar, no reasignar.
  SELECT string_agg(format('%s→%s', l.external_id, coalesce(p.email, '<sin perfil>')), ', '
                    ORDER BY l.external_id)
    INTO v_resumen
    FROM public.listings l
    JOIN public.seller_profiles sp ON sp.id = l.seller_profile_id
    LEFT JOIN public.profiles p    ON p.id  = sp.user_id
   WHERE l.external_id IN ('PY-0241', 'PY-0188', 'PY-0099', 'PY-0317', 'PY-0402')
     AND sp.id NOT IN (v_particular, v_empresa);
  IF v_resumen IS NOT NULL THEN
    RAISE NOTICE 'demo(propiedades): publicaciones demo con un vendedor que no es de la demo (%); no se reasignan (RF-15)',
      v_resumen;
  END IF;

  -- Resumen por vendedor y estado: es lo que se revisa a mano tras el reset.
  SELECT string_agg(format('%s/%s=%s', sp.seller_type, agg.estado, agg.n), ', '
                    ORDER BY sp.seller_type, agg.estado)
    INTO v_resumen
    FROM (
      SELECT l.seller_profile_id, l.status AS estado, count(*) AS n
        FROM public.listings l
       WHERE l.external_id IN ('PY-0241', 'PY-0188', 'PY-0099', 'PY-0317', 'PY-0402')
       GROUP BY l.seller_profile_id, l.status
    ) AS agg
    JOIN public.seller_profiles sp ON sp.id = agg.seller_profile_id;

  RAISE NOTICE 'demo(propiedades): nuevas=%, ya existentes=% (sin tocar); reparto: %',
    v_nuevas, v_omitidas, coalesce(v_resumen, '<sin publicaciones>');
END;
$demo_entidades_publicaciones$;

-- ============================================================================
-- T5 — DESTACADAS Y VÍNCULO CON LOS AGENTES DE REFERENCIA (RF-8, RF-9, RF-17)
-- ----------------------------------------------------------------------------
-- T4 dejó las 5 publicaciones con `featured = false` y `agent_id = NULL`. Este
-- bloque completa lo que la demo ya tenía: las 3 publicaciones de la EMPRESA
-- destacadas (la portada muestra las 2 activas, RF-9) y las 5 vinculadas a uno
-- de los 3 agentes de referencia, en reparto round-robin (plan §5, RF-8). El
-- vínculo es solo informativo (`listings.agent_id`): no se crea ninguna cuenta
-- ni se modifica la tabla `agents` (RF-17).
--
-- --- Por qué cada UPDATE se filtra por dueño --------------------------------
-- T4 pudo omitir una publicación demo porque su `external_id` ya existía en una
-- base poblada (p. ej. la del script viejo) a nombre de otra cuenta. Esa fila
-- NO es de la demo: este bloque la informa y no la modifica (RF-13/RF-15). Por
-- eso cada UPDATE exige, además del id literal, que `seller_profile_id` sea uno
-- de los dos perfiles de vendedor demo.
--
-- --- Por qué hace falta la sesión privilegiada para `featured` ---------------
-- `guard_listings_featured` (migración 20261017000100) revierte `featured` a
-- `false` en toda sesión que no sea privilegiada ni admin. La del sembrado SÍ
-- es privilegiada (`is_privileged_session()`: current_user NOT IN
-- ('anon','authenticated')), así que el guard devuelve la fila tal cual y la
-- destacada persiste. No se toca el guard ni se abre un bypass: si la sesión no
-- fuera privilegiada, la verificación final aborta en vez de dejar la demo sin
-- destacadas en silencio.
--
-- --- Idempotencia -----------------------------------------------------------
-- Los UPDATE llevan `IS DISTINCT FROM` sobre ambas columnas: una segunda corrida
-- no reescribe filas ya correctas (RF-13/RF-14). No se inserta ni se borra nada.
--
--   | external_id | featured | agente de referencia       |
--   |-------------|----------|----------------------------|
--   | PY-0241     | true     | agente 1 (11111111-…-1111) |
--   | PY-0188     | true     | agente 2 (22222222-…-2222) |
--   | PY-0099     | true     | agente 2 (22222222-…-2222) |
--   | PY-0317     | false    | agente 3 (33333333-…-3333) |
--   | PY-0402     | false    | agente 1 (11111111-…-1111) |
-- ============================================================================
DO $demo_destacadas_agentes$
DECLARE
  v_particular      uuid;
  v_empresa         uuid;
  v_agente1         uuid;
  v_agente2         uuid;
  v_agente3         uuid;
  v_fila            record;
  v_dueno           uuid;
  v_ext_actual      text;
  v_otro_id         uuid;
  v_agente          uuid;
  v_filas           integer;
  v_cambiadas       integer := 0;
  v_ajenas          text[] := ARRAY[]::text[];
  v_desvios         text;
  v_propias         integer;
  v_destacadas      integer;
  v_con_agente      integer;
  v_agentes         integer;
BEGIN
  -- Revalidación de la guardia: primera sentencia, antes de cualquier UPDATE.
  PERFORM pg_temp.demo_require_local();

  -- 1) Preflight (RF-18): los `seller_profile` los genera el trigger de alta
  --    (se buscan por `user_id` literal, nunca por email) y los 3 agentes de
  --    referencia los siembra `seed.sql`, que corre antes que este archivo. Si
  --    falta algo no se puede cumplir el reparto: se aborta ANTES de escribir.
  SELECT sp.id INTO v_particular
    FROM public.seller_profiles sp
   WHERE sp.user_id = 'd0000000-0000-4000-8000-000000000002';
  SELECT sp.id INTO v_empresa
    FROM public.seller_profiles sp
   WHERE sp.user_id = 'd0000000-0000-4000-8000-000000000003';

  IF v_particular IS NULL OR v_empresa IS NULL THEN
    RAISE EXCEPTION
      'demo(destacadas): falta el seller_profile de una vendedora demo (particular=%, empresa=%)',
      coalesce(v_particular::text, '<NULL>'), coalesce(v_empresa::text, '<NULL>')
      USING HINT = 'El sembrado asume que T3 dejó un seller_profile por vendedora '
                   '(user_id d0000000-…-0002 y d0000000-…-0003). No se modificó ninguna publicación.';
  END IF;

  SELECT a.id INTO v_agente1 FROM public.agents a
   WHERE a.id = '11111111-1111-1111-1111-111111111111';
  SELECT a.id INTO v_agente2 FROM public.agents a
   WHERE a.id = '22222222-2222-2222-2222-222222222222';
  SELECT a.id INTO v_agente3 FROM public.agents a
   WHERE a.id = '33333333-3333-3333-3333-333333333333';

  IF v_agente1 IS NULL OR v_agente2 IS NULL OR v_agente3 IS NULL THEN
    RAISE EXCEPTION
      'demo(destacadas): falta un agente de referencia (1=%, 2=%, 3=%)',
      coalesce(v_agente1::text, '<NULL>'),
      coalesce(v_agente2::text, '<NULL>'),
      coalesce(v_agente3::text, '<NULL>')
      USING HINT = 'Los 3 agentes los siembra `supabase/seed.sql`, que corre antes que '
                   './seeds/demo.sql (orden de sql_paths en config.toml). No se modificó ninguna publicación.';
  END IF;

  -- 2) Actualización scoped por id literal + `external_id` + dueño demo. El
  --    `IS DISTINCT FROM` evita reescribir filas que ya están como deben.
  FOR v_fila IN
    SELECT *
      FROM (VALUES
        (1, 'PY-0241'::text, '10000000-0000-4000-8000-000000000001'::uuid, true::boolean,  1::integer),
        (2, 'PY-0188',       '10000000-0000-4000-8000-000000000002',        true,            2),
        (3, 'PY-0099',       '10000000-0000-4000-8000-000000000003',        true,            2),
        (4, 'PY-0317',       '10000000-0000-4000-8000-000000000004',        false,           3),
        (5, 'PY-0402',       '10000000-0000-4000-8000-000000000005',        false,           1)
      ) AS t(orden, external_id, listing_id, destacada, agente)
     ORDER BY t.orden
  LOOP
    v_agente := CASE v_fila.agente
                  WHEN 1 THEN v_agente1
                  WHEN 2 THEN v_agente2
                  ELSE v_agente3
                END;

    -- 2a) ¿Existe la fila con su id literal? Si no, puede existir por
    --     `external_id` con otro id (base sembrada por el script viejo): en ese
    --     caso no es nuestra y no se toca (RF-15).
    SELECT l.seller_profile_id, l.external_id
      INTO v_dueno, v_ext_actual
      FROM public.listings l
     WHERE l.id = v_fila.listing_id;

    IF NOT FOUND THEN
      v_otro_id := NULL;
      v_dueno   := NULL;
      SELECT l.id, l.seller_profile_id
        INTO v_otro_id, v_dueno
        FROM public.listings l
       WHERE l.external_id = v_fila.external_id
       LIMIT 1;

      IF FOUND THEN
        v_ajenas := v_ajenas ||
          format('%s (id %s, dueño %s)', v_fila.external_id, v_otro_id,
                 coalesce(v_dueno::text, '<sin perfil>'));
        RAISE NOTICE
          'demo(destacadas): % existe con otro id (%) y dueño %; no se toca (RF-15)',
          v_fila.external_id, v_otro_id, coalesce(v_dueno::text, '<sin perfil>');
      ELSE
        v_ajenas := v_ajenas || format('%s (sin fila con su id literal)', v_fila.external_id);
        RAISE NOTICE
          'demo(destacadas): % no existe con su id literal (%); no se crea (T4 ya verificó las 5 por external_id)',
          v_fila.external_id, v_fila.listing_id;
      END IF;
      CONTINUE;
    END IF;

    -- 2b) Fila encontrada: solo se modifica si es de la demo. Una publicación
    --     con el mismo id/external_id pero de otro perfil se informa, no se
    --     reasigna (RF-13/RF-15).
    IF v_ext_actual IS DISTINCT FROM v_fila.external_id
       OR v_dueno IS NULL
       OR v_dueno NOT IN (v_particular, v_empresa) THEN
      v_ajenas := v_ajenas ||
        format('%s (%s, dueño %s)', v_fila.external_id, v_fila.listing_id,
               coalesce(v_dueno::text, '<sin perfil>'));
      RAISE NOTICE
        'demo(destacadas): % (%) no pertenece a las vendedoras demo (dueño=%, external_id=%); no se modifica (RF-13/RF-15)',
        v_fila.external_id, v_fila.listing_id, coalesce(v_dueno::text, '<sin perfil>'),
        coalesce(v_ext_actual, '<NULL>');
      CONTINUE;
    END IF;

    UPDATE public.listings l
       SET featured   = v_fila.destacada,
           agent_id   = v_agente,
           updated_at = now()
     WHERE l.id = v_fila.listing_id
       AND l.external_id = v_fila.external_id
       AND l.seller_profile_id IN (v_particular, v_empresa)
       AND (l.featured IS DISTINCT FROM v_fila.destacada
         OR l.agent_id IS DISTINCT FROM v_agente);

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    IF v_filas > 0 THEN
      v_cambiadas := v_cambiadas + v_filas;
      RAISE NOTICE 'demo(destacadas): % actualizada (featured=%, agente=%)',
        v_fila.external_id, v_fila.destacada, v_fila.agente;
    END IF;
  END LOOP;

  -- 3) Verificación posterior (RF-18): de las filas que son de la demo, el
  --    destacado y el agente tienen que haber quedado aplicados. Si el guard
  --    revirtió `featured` o el UPDATE no persistió, se aborta: una demo con
  --    esas columnas incompletas no debe pasar por exitosa.
  SELECT string_agg(
           format('%s: featured=%s (esperado %s), agent_id=%s (esperado %s)',
                  e.external_id, l.featured, e.destacada,
                  coalesce(l.agent_id::text, '<NULL>'), e.agente),
           '; ' ORDER BY e.orden)
    INTO v_desvios
    FROM (VALUES
      (1, 'PY-0241'::text, '10000000-0000-4000-8000-000000000001'::uuid, true::boolean,  v_agente1),
      (2, 'PY-0188',       '10000000-0000-4000-8000-000000000002',        true,            v_agente2),
      (3, 'PY-0099',       '10000000-0000-4000-8000-000000000003',        true,            v_agente2),
      (4, 'PY-0317',       '10000000-0000-4000-8000-000000000004',        false,           v_agente3),
      (5, 'PY-0402',       '10000000-0000-4000-8000-000000000005',        false,           v_agente1)
    ) AS e(orden, external_id, listing_id, destacada, agente)
    JOIN public.listings l ON l.id = e.listing_id
   WHERE l.external_id = e.external_id
     AND l.seller_profile_id IN (v_particular, v_empresa)
     AND (l.featured IS DISTINCT FROM e.destacada
       OR l.agent_id IS DISTINCT FROM e.agente);

  IF v_desvios IS NOT NULL THEN
    RAISE EXCEPTION 'demo(destacadas): el destacado o el agente no quedaron aplicados — %',
      v_desvios
      USING HINT = 'La sesión del sembrado debe ser privilegiada para que '
                   'guard_listings_featured no revierta `featured`; el vínculo con el agente '
                   'tampoco debe quedar en NULL. No se resuelve aflojando el guard.';
  END IF;

  -- 4) Cierre: 3 destacadas y 5 con agente entre las filas efectivamente de la
  --    demo. Las filas ajenas se informaron arriba y no se tocaron (RF-15).
  SELECT count(*),
         count(*) FILTER (WHERE l.featured),
         count(*) FILTER (WHERE l.agent_id IS NOT NULL)
    INTO v_propias, v_destacadas, v_con_agente
    FROM (VALUES
      (1, 'PY-0241'::text, '10000000-0000-4000-8000-000000000001'::uuid),
      (2, 'PY-0188',       '10000000-0000-4000-8000-000000000002'),
      (3, 'PY-0099',       '10000000-0000-4000-8000-000000000003'),
      (4, 'PY-0317',       '10000000-0000-4000-8000-000000000004'),
      (5, 'PY-0402',       '10000000-0000-4000-8000-000000000005')
    ) AS e(orden, external_id, listing_id)
    JOIN public.listings l ON l.id = e.listing_id AND l.external_id = e.external_id
   WHERE l.seller_profile_id IN (v_particular, v_empresa);

  IF v_propias = 5 AND (v_destacadas <> 3 OR v_con_agente <> 5) THEN
    RAISE EXCEPTION
      'demo(destacadas): se esperaban 3 destacadas y 5 con agente entre las 5 publicaciones demo; quedaron % destacadas y % con agente',
      v_destacadas, v_con_agente
      USING HINT = 'Revisá los NOTICE previos. Si el guard revirtió `featured`, la sesión del '
                   'sembrado no era privilegiada.';
  END IF;

  IF v_propias < 5 THEN
    RAISE NOTICE
      'demo(destacadas): % de 5 publicaciones demo son de las vendedoras demo; las demás se informaron y no se tocaron (RF-15): %',
      v_propias, array_to_string(v_ajenas, '; ');
  END IF;

  SELECT count(*) INTO v_agentes FROM public.agents;
  RAISE NOTICE
    'demo(destacadas): filas actualizadas=%, propias=%/5, destacadas=% (esperado 3), con agente=% (esperado 5), agentes en la tabla=%',
    v_cambiadas, v_propias, v_destacadas, v_con_agente, v_agentes;
END;
$demo_destacadas_agentes$;

-- ============================================================================
-- T6 — CONTADORES DE VENDEDOR Y CIERRE DEL SEMBRADO
--      (RF-13, RF-14, RF-15, RF-16, RF-18)
-- ----------------------------------------------------------------------------
-- T3 dejó los `seller_profiles` de las dos vendedoras con sus límites
-- (`max_properties` 5/50) y `properties_count` sin tocar; T4 insertó las 5
-- publicaciones. Este bloque deja el contador en el valor que le corresponde a
-- lo sembrado y cierra el archivo con una verificación global del sembrado.
--
-- --- De dónde sale la fórmula del contador (evidencia, no invención) ---------
-- `properties_count` NO lo mantiene un recálculo dentro de la base. Lo mueven
-- dos piezas, una por cada alta y cada baja de `listings`:
--
--   * ALTA: la app llama al RPC justo después de insertar la publicación
--     (`src/lib/actions/properties.ts:247-248`,
--     `rpc('increment_properties_count', …)`), que hace
--     `properties_count = COALESCE(properties_count, 0) + 1`
--     (`supabase/migrations/20261017000100_security_hardening.sql:375-387`).
--   * BAJA: el trigger `trg_listings_decrement_count`
--     (`20261017000100_security_hardening.sql:408-421` para la función y
--     `:424-438` para el trigger) hace
--     `properties_count = GREATEST(0, COALESCE(properties_count, 0) - 1)`
--     filtrando por `OLD.seller_profile_id`.
--
-- Ninguna de las dos filtra por `status` ni por ningún otro campo: suman o
-- restan 1 por cada fila de `listings` del vendedor. Por eso el valor coherente
-- con ese mantenimiento —y el que usa la app para comparar contra
-- `max_properties`, p. ej. `src/app/(seller)/vendedor/propiedades/nueva/page.tsx:14-20`—
-- es el total de publicaciones del vendedor, sin importar el estado:
--
--     properties_count = count(*) de public.listings
--                        WHERE seller_profile_id = <perfil del vendedor>
--
-- No se copia una fórmula que el trigger no tiene (el trigger no cuenta): se
-- reproduce el invariante que dejan el alta y el borrado.
--
-- --- Alcance e idempotencia (RF-13/RF-15) -----------------------------------
-- El UPDATE se filtra por los **ids literales de `user_id`** de las dos
-- vendedoras demo (`d0000000-…-0002` y `d0000000-…-0003`), nunca por correo ni
-- por rol. Ningún otro `seller_profile` puede caer en el WHERE, así que las
-- filas ajenas quedan intactas aunque el vendedor tenga publicaciones cargadas
-- a mano (esas sí entran en el conteo de su propio perfil, porque el contador
-- debe reflejar la realidad). `IS DISTINCT FROM` evita reescribir filas que ya
-- coinciden: una segunda corrida actualiza 0 filas.
-- ============================================================================
DO $demo_contadores$
DECLARE
  -- Ids literales de las cuentas de las vendedoras demo (mismos de T2/T3/T4).
  v_id_particular constant uuid := 'd0000000-0000-4000-8000-000000000002';
  v_id_empresa    constant uuid := 'd0000000-0000-4000-8000-000000000003';
  v_perfil        uuid;
  v_problemas     text[] := ARRAY[]::text[];
  v_filas         integer;
  v_desvios       text;
  v_faltantes     text;
  v_cuentas       integer;
  v_perfiles      integer;
  v_publicaciones integer;
  v_destacadas    integer;
  v_con_agente    integer;
  v_resumen       text;
  v_credenciales  text;
BEGIN
  -- Revalidación de la guardia: primera sentencia, antes de cualquier UPDATE.
  PERFORM pg_temp.demo_require_local();

  -- 1) Preflight (RF-18): sin los dos `seller_profiles` no hay contador que
  --    recalcular. Se buscan por `user_id` literal (el id del perfil lo genera
  --    el trigger de alta) y se aborta ANTES de escribir.
  SELECT sp.id INTO v_perfil
    FROM public.seller_profiles sp
   WHERE sp.user_id = v_id_particular;
  IF v_perfil IS NULL THEN
    v_problemas := v_problemas || 'particular (d0000000-…-0002) sin seller_profile'::text;
  END IF;

  SELECT sp.id INTO v_perfil
    FROM public.seller_profiles sp
   WHERE sp.user_id = v_id_empresa;
  IF v_perfil IS NULL THEN
    v_problemas := v_problemas || 'empresa (d0000000-…-0003) sin seller_profile'::text;
  END IF;

  IF array_length(v_problemas, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'demo(contadores): no se puede recalcular properties_count — %',
      array_to_string(v_problemas, '; ')
      USING HINT = 'El sembrado asume que T3 dejó un seller_profile por vendedora '
                   '(user_id d0000000-…-0002 y d0000000-…-0003). No se modificó ningún contador.';
  END IF;

  -- 2) Recálculo scoped por id literal de `user_id`, con la fórmula del
  --    invariante documentada arriba. `IS DISTINCT FROM` deja la sentencia
  --    idempotente: si ya coincide, la fila no se reescribe.
  UPDATE public.seller_profiles sp
     SET properties_count = (
           SELECT count(*)::integer
             FROM public.listings l
            WHERE l.seller_profile_id = sp.id
         )
   WHERE sp.user_id IN (v_id_particular, v_id_empresa)
     AND sp.properties_count IS DISTINCT FROM (
           SELECT count(*)::integer
             FROM public.listings l
            WHERE l.seller_profile_id = sp.id
         );
  GET DIAGNOSTICS v_filas = ROW_COUNT;

  -- 3) Verificación de los contadores (RF-18): cada vendedora demo tiene que
  --    quedar con exactamente el número de filas de `listings` de su perfil.
  --    Si un guard hubiera revertido el cambio en silencio, se aborta.
  SELECT string_agg(
           format('%s: properties_count=%s, publicaciones=%s',
                  e.etiqueta,
                  coalesce(sp.properties_count::text, '<NULL>'),
                  r.real), '; ' ORDER BY e.etiqueta)
    INTO v_desvios
    FROM (VALUES
      ('particular'::text, v_id_particular),
      ('empresa'::text,    v_id_empresa)
    ) AS e(etiqueta, user_id)
    JOIN public.seller_profiles sp ON sp.user_id = e.user_id
    CROSS JOIN LATERAL (
      SELECT count(*)::integer AS real
        FROM public.listings l
       WHERE l.seller_profile_id = sp.id
    ) AS r
   WHERE sp.properties_count IS DISTINCT FROM r.real;

  IF v_desvios IS NOT NULL THEN
    RAISE EXCEPTION 'demo(contadores): el contador no quedó igual al número real de publicaciones — %',
      v_desvios
      USING HINT = 'La sesión del sembrado debe ser privilegiada para que guard_seller_profiles '
                   'no revierta properties_count. No se resuelve aflojando el guard.';
  END IF;

  -- 4) Cierre del sembrado (RF-18): cuentas, perfiles y publicaciones demo
  --    tienen que estar completos. Es la última red del archivo.
  SELECT count(*) INTO v_cuentas
    FROM auth.users u
   WHERE u.id IN (
     'd0000000-0000-4000-8000-000000000001'::uuid,
     'd0000000-0000-4000-8000-000000000002'::uuid,
     'd0000000-0000-4000-8000-000000000003'::uuid,
     'd0000000-0000-4000-8000-000000000004'::uuid,
     'd0000000-0000-4000-8000-000000000005'::uuid
   );

  IF v_cuentas < 5 THEN
    RAISE EXCEPTION 'demo(contadores): solo quedaron % de 5 cuentas demo', v_cuentas
      USING HINT = 'Una cuenta con un correo de demo a nombre de otra persona no se crea ni se '
                   'modifica (RF-16), pero entonces la demo no puede completarse en esta base. '
                   'Revisá los NOTICE de T2/T3.';
  END IF;

  --    Las 5 publicaciones se identifican por `external_id` (criterio de T4/T5),
  --    así una base que ya tenía estos inmuebles no aborta por duplicados.
  SELECT string_agg(e.external_id, ', ' ORDER BY e.external_id)
    INTO v_faltantes
    FROM (VALUES
      ('PY-0241'::text), ('PY-0188'), ('PY-0099'), ('PY-0317'), ('PY-0402')
    ) AS e(external_id)
   WHERE NOT EXISTS (
     SELECT 1 FROM public.listings l WHERE l.external_id = e.external_id
   );

  IF v_faltantes IS NOT NULL THEN
    RAISE EXCEPTION 'demo(contadores): faltan publicaciones demo por external_id — %', v_faltantes
      USING HINT = 'T4 informa si una publicación demo ya existía con otro dueño; el sembrado no '
                   'reasigna ni duplica filas ajenas (RF-15). Revisá los NOTICE de T4.';
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE l.featured),
         count(*) FILTER (WHERE l.agent_id IS NOT NULL)
    INTO v_publicaciones, v_destacadas, v_con_agente
    FROM public.listings l
   WHERE l.external_id IN ('PY-0241', 'PY-0188', 'PY-0099', 'PY-0317', 'PY-0402');

  SELECT count(*) INTO v_perfiles
    FROM public.seller_profiles sp
   WHERE sp.user_id IN (v_id_particular, v_id_empresa);

  IF v_perfiles < 2 THEN
    RAISE EXCEPTION 'demo(contadores): solo quedaron % de 2 seller_profiles demo', v_perfiles;
  END IF;

  IF v_publicaciones > 5 THEN
    -- Duplicados de una base ya poblada: no se tocan (RF-15), solo se avisa.
    RAISE NOTICE 'demo(contadores): hay % publicaciones con los `external_id` de demo (esperado 5); no se modifica ninguna',
      v_publicaciones;
  END IF;

  -- 5) Resumen de contadores para el NOTICE final.
  SELECT string_agg(
           format('%s=%s/%s (%s publicaciones)',
                  sp.seller_type,
                  sp.properties_count,
                  sp.max_properties,
                  (SELECT count(*)::integer
                     FROM public.listings l
                    WHERE l.seller_profile_id = sp.id)),
           ', ' ORDER BY sp.seller_type)
    INTO v_resumen
    FROM public.seller_profiles sp
   WHERE sp.user_id IN (v_id_particular, v_id_empresa);

  RAISE NOTICE
    'demo(contadores): filas recalculadas=% (una segunda corrida no actualiza ninguna); contadores: %',
    v_filas, coalesce(v_resumen, '<sin perfiles demo>');

  -- Resumen final del sembrado completo (RF-18): legible en la salida del reset.
  RAISE NOTICE
    'demo(cierre): cuentas=%/5, seller_profiles=%/2, publicaciones demo=% (esperado 5), destacadas=% (esperado 3), con agente=% (esperado 5); contadores: % — sembrado de demo completo.',
    v_cuentas, v_perfiles, v_publicaciones, v_destacadas, v_con_agente,
    coalesce(v_resumen, '<sin perfiles demo>');

  -- Credenciales de prueba en la salida del reset (RF-6). Se leen de las
  -- constantes con las que T2 creó las cuentas (bloque T2.0), no se reescriben
  -- acá: así no pueden desincronizarse de lo que realmente se sembró.
  SELECT string_agg(format('  • %s | %s | %s', c.email, p.valor, c.rol),
                    E'\n' ORDER BY c.user_id)
    INTO v_credenciales
    FROM demo_credenciales c
    CROSS JOIN demo_parametros p
   WHERE p.clave = 'password';

  RAISE NOTICE E'demo(credenciales): cuentas de prueba (correo | contraseña | rol):\n%\nLa demo solo existe en el entorno LOCAL (la guardia impide sembrarla fuera de local). Credenciales, alcance y qué NO trae: docs/demo-local.md.',
    coalesce(v_credenciales, '<sin cuentas demo>');
END;
$demo_contadores$;
