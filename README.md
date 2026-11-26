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
pnpm db:start
pnpm dev
```

La app queda disponible en <http://localhost:3000>.

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
