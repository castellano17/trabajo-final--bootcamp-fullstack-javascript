# ReseñIt

Plataforma de reseñas de taquerías: descubre taquerías, publica reseñas con puntaje y fotos, y sigue la actividad en vivo.

Trabajo final del Bootcamp Fullstack JavaScript.

## Requisitos

- Node.js 24 (versión fijada en `.nvmrc`)
- pnpm 10
- Docker (para la base de datos local de Supabase)

## Correr en local

```bash
pnpm install
cp .env.example .env.local
echo "SUPABASE_AUTH_CAPTCHA_SECRET=1x0000000000000000000000000000000AA" > supabase/.env
pnpm db:start
pnpm dev
```

Completa `.env.local` con los valores de la tabla siguiente y abre <http://localhost:3000>.

## Variables de entorno

| Variable                               | Local                                                                       | Producción (Vercel)                   |
| -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `http://127.0.0.1:55321`                                                    | `https://<project-ref>.supabase.co`   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` de `pnpm exec supabase status`                            | Clave `sb_publishable_…` del proyecto |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | `1x00000000000000000000AA` (clave de prueba de Cloudflare, siempre aprueba) | Site key del widget de Turnstile      |

`supabase/.env` solo lo usa el Supabase local: contiene la clave secreta de prueba de Turnstile. En producción la clave secreta vive únicamente en la configuración de Supabase Auth; la app nunca la ve.

## Autenticación

- Registro con email y contraseña (mínimo 8 caracteres, con mayúsculas, minúsculas y números) y confirmación por correo.
- Inicio y cierre de sesión, reenvío de la confirmación y recuperación de contraseña.
- Los campos de contraseña tienen un botón para mostrarla u ocultarla.
- La sesión se valida en el servidor con `getClaims()`. Los mensajes nunca revelan si un correo está registrado.
- Todos los formularios llevan Cloudflare Turnstile, que Supabase Auth valida en el servidor.
- Cabeceras de seguridad: Content Security Policy con `nonce` por petición, HSTS, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`.

En local los correos no se envían: se ven en Mailpit (<http://127.0.0.1:55324>).

### Configuración de producción

Supabase (<https://supabase.com/dashboard>, proyecto de producción):

1. **Authentication → URL Configuration**
   - Site URL: `https://trabajo-final-bootcamp-fullstack-ja.vercel.app`
   - Redirect URLs: `https://trabajo-final-bootcamp-fullstack-ja.vercel.app/**` y `https://*-castellano17s-projects.vercel.app/**` (previews de Vercel)
2. **Authentication → Sign In / Providers → Email**: activar _Confirm email_.
3. **Authentication → Sign In / Providers → Email → Password**: longitud mínima `8` y requisitos _Lowercase, uppercase letters and digits_.
4. **Authentication → Emails → SMTP Settings**: activar _Custom SMTP_ con Gmail.
   - Host `smtp.gmail.com`, puerto `587`.
   - Usuario y remitente: tu dirección de Gmail. Nombre del remitente: `ReseñIt`.
   - Contraseña: una contraseña de aplicación de Google (<https://myaccount.google.com/apppasswords>, requiere la verificación en dos pasos). Si un correo no llega, revisa la carpeta de spam.
5. **Authentication → Emails → Templates**
   - _Confirm signup_: asunto `Confirma tu cuenta en ReseñIt` y el contenido de `supabase/templates/confirmation.html`.
   - _Reset password_: asunto `Recupera tu contraseña de ReseñIt` y el contenido de `supabase/templates/recovery.html`.
6. **Authentication → Attack Protection**: activar _CAPTCHA protection_ con el proveedor _Turnstile_ y la secret key del widget.
7. **Project Settings → JWT Keys**: comprobar que la clave en uso es asimétrica (ECC o RSA), para que `getClaims()` valide el token sin llamar al servidor de Auth.
8. **Project Settings → API Keys**: copiar la clave `sb_publishable_…`.

Cloudflare (<https://dash.cloudflare.com> → Turnstile): crear un widget _Managed_ con el dominio `trabajo-final-bootcamp-fullstack-ja.vercel.app`. Turnstile no acepta comodines, así que para probar una preview hay que agregar en _Hostname Management_ el dominio de su rama, el que Vercel publica en el PR y que se mantiene en cada push (por ejemplo `trabajo-final-bootcamp-fullst-git-fd4654-castellano17s-projects.vercel.app`). El plan gratuito admite 10 dominios por widget. Si falta el dominio, el widget muestra el error `110200`.

Vercel (proyecto → **Settings → Environment Variables**): crear las tres variables `NEXT_PUBLIC_*` para _Production_ y _Preview_ y volver a desplegar.

## Perfil y avatares

- En `/perfil` cada usuario cambia su nombre (de 1 a 50 caracteres) y su foto. La cabecera muestra la foto, o las iniciales si no hay foto.
- La foto se cambia desde un modal: se arrastra la imagen o se elige con un clic, y en el celular también se puede tomar con la cámara. Después se encuadra moviéndola y con un zoom de 1× a 3×. El navegador recorta esa área a 512×512 en WebP antes de subirla, así que una foto de celular queda en unos 50 KB.
- Se aceptan JPEG, PNG y WebP de hasta 2 MB.
- Cómo se protegen los archivos:
  - El servidor revisa el tipo real del archivo por sus primeros bytes, no por la extensión ni por el tipo que declara el navegador.
  - El bucket `avatars` es público para lectura, pero sus políticas solo dejan subir, reemplazar y borrar dentro de la carpeta propia (`avatars/<id del usuario>/`).
  - `profiles.avatar_url` guarda la ruta del archivo, y una restricción de la base obliga a que esté en la carpeta del propio usuario: nadie puede usar una imagen externa ni la de otro usuario.
  - Cada subida usa un nombre de archivo nuevo y borra el anterior, así que ninguna caché muestra una foto vieja y no se acumulan archivos.
- El bucket y sus políticas los crea la migración `create_avatars_bucket`. En producción los aplica `deploy-db`; no hay que configurar nada en el panel de Supabase.

## Logs

La app escribe una línea JSON por evento de autenticación y de perfil en la salida estándar, que Vercel muestra en **Logs**. Cada línea tiene `level`, `event`, `timestamp` y contexto como `userId` o `reason`:

```json
{
  "level": "warn",
  "event": "auth.sign_in.failed",
  "timestamp": "2026-11-27T00:44:33.065Z",
  "reason": "invalid_credentials"
}
```

| Evento                                                                                 | Nivel       | Para qué sirve                                                                                        |
| -------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `auth.sign_up.requested`, `auth.sign_up.confirmed`                                     | info        | Medir cuántos registros llegan a confirmarse                                                          |
| `auth.sign_in.succeeded`, `auth.sign_out`                                              | info        | Auditar el acceso de cada usuario                                                                     |
| `auth.sign_in.failed`                                                                  | warn        | Detectar intentos de fuerza bruta (`invalid_credentials`) o cuentas sin confirmar                     |
| `auth.sign_up.failed`, `auth.confirmation.resend_failed`, `auth.password_reset.failed` | warn        | Detectar CAPTCHA fallidos o límites de envío alcanzados                                               |
| `auth.confirmation.resent`, `auth.password_reset.requested`                            | info        | Seguir los envíos de correo cuando alguien dice que no le llegó                                       |
| `auth.password_reset.verified`, `auth.password.updated`, `auth.password.update_failed` | info / warn | Auditar los cambios de contraseña                                                                     |
| `auth.confirm.failed`                                                                  | warn        | Detectar enlaces vencidos o manipulados (`otp_expired`, `malformed_link`)                             |
| `profile.display_name.updated`, `profile.avatar.updated`, `profile.avatar.removed`     | info        | Auditar los cambios de perfil                                                                         |
| `profile.avatar.rejected`                                                              | warn        | Detectar archivos que no son imágenes (`unsupported_type`) o demasiado grandes (`too_large`)          |
| `profile.update.failed`                                                                | warn        | Detectar fallos al guardar en la base o en Storage, incluido un avatar anterior que no se pudo borrar |

Qué no se registra y por qué: correos, contraseñas, tokens, cookies ni nombres de archivo. El logger descarta cualquier campo cuyo nombre contenga `email`, `password`, `token`, `secret` o `cookie`, aunque se le pase por error. Así los logs sirven para investigar incidentes sin convertirse en una fuga de datos personales.

## Base de datos local

La base de datos corre con la CLI de Supabase en Docker. Los puertos usan el rango `553xx` para no chocar con otros proyectos de Supabase:

| Servicio      | URL                                                       |
| ------------- | --------------------------------------------------------- |
| API           | <http://127.0.0.1:55321>                                  |
| Postgres      | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Studio        | <http://127.0.0.1:55323>                                  |
| Correo (test) | <http://127.0.0.1:55324>                                  |

| Comando         | Qué hace                                                           |
| --------------- | ------------------------------------------------------------------ |
| `pnpm db:start` | Levanta Supabase en local                                          |
| `pnpm db:stop`  | Lo detiene                                                         |
| `pnpm db:reset` | Recrea la base: aplica todas las migraciones y `supabase/seed.sql` |
| `pnpm db:test`  | Corre los tests de base de datos (pgTAP) de `supabase/tests`       |
| `pnpm db:types` | Regenera `src/types/database.ts` a partir del esquema              |

Después de cambiar el esquema hay que crear una migración nueva con `pnpm exec supabase migration new <nombre>` y regenerar los tipos con `pnpm db:types`. Las migraciones ya aplicadas no se modifican.

### Cuentas de prueba

El seed crea tres cuentas, solo en local, todas con la contraseña `password123`:

| Email                    | Rol       |
| ------------------------ | --------- |
| `user@resenit.test`      | usuario   |
| `moderator@resenit.test` | moderador |
| `admin@resenit.test`     | admin     |

### Primer administrador en producción

Todos los usuarios nacen con el rol `user` y nadie puede cambiar su propio rol. Para crear el primer admin, regístrate en la app y ejecuta esto una sola vez en el SQL Editor del proyecto de Supabase:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
```

A partir de ahí, los roles se gestionan desde la app con la función `set_user_role`, que solo pueden usar los administradores.

## Modelo de datos

El esquema usa nombres en inglés. Equivalencia con los campos de la consigna:

| Tabla           | Consigna                                                              | Esquema                                                                        |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `profiles`      | nombre, avatar_url, rol (usuario, moderador, admin)                   | `display_name`, `avatar_url`, `role` (user, moderator, admin)                  |
| `places`        | nombre, categoría, descripción, dirección, promedio, cantidad_reseñas | `name`, `category`, `description`, `address`, `average_rating`, `review_count` |
| `reviews`       | puntaje, texto, oculta                                                | `rating`, `body`, `is_hidden`                                                  |
| `review_photos` | storage_path                                                          | `storage_path`                                                                 |
| `comments`      | texto                                                                 | `body`                                                                         |
| `review_votes`  | review_id, user_id                                                    | `review_id`, `user_id`                                                         |
| `reports`       | reportado_por, motivo, estado                                         | `reported_by`, `reason`, `status` (pending, accepted, rejected)                |
