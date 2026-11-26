# Trabajo Final — Bootcamp Fullstack JavaScript

**ReseñIt — Aplicación de reseñas online**

Fuente: [consigna en Notion](https://iamdoomling.notion.site/Trabajo-Final-Bootcamp-Fullstack-JavaScript-41e63961b3048070b669caade2eb3467)

| | |
| --- | --- |
| **Fecha final de entrega** | 08 de enero de 2027 a las 23:59 hrs (MX) |
| **Método de entrega** | <https://codigofacilito.com/bootcamps/fullstack-javascript-g2/projects/new> |
| **Dudas o consultas** | Ver contacto en la consigna de Notion |

## Objetivo

Construir y desplegar una plataforma de reseñas fullstack que integre todo el stack del bootcamp: React moderno (hooks, concurrencia, Server Components), Next.js (App Router, Route Handlers, Server Actions), TypeScript y Supabase (auth con roles, base relacional con RLS, storage, realtime y edge functions), con pipeline de CI/CD y monitoreo básico en producción.

La evaluación se hará en función de que el proyecto funcione como un todo coherente, no cada tema por separado.

## Consigna

Desarrollar una plataforma donde los usuarios descubren lugares o eventos de una categoría a elección (cafés, librerías, bares, recitales, canchas, etc.), publican reseñas con puntaje y fotos, comentan las reseñas de otros y ven esa actividad aparecer en vivo. Un moderador puede ocultar contenido inapropiado y un administrador gestiona los lugares.

La categoría es libre, siempre que el proyecto cumpla de forma orgánica todos los requisitos técnicos de este documento.

## Funcionalidades mínimas del producto

- [ ] Un administrador crea y edita lugares
- [ ] Un visitante sin cuenta puede explorar el listado de lugares y leer sus reseñas
- [ ] Un usuario se registra, inicia sesión y edita su perfil (nombre y avatar)
- [ ] Un usuario autenticado publica una reseña con puntaje de 1 a 5, texto y hasta 3 fotos
- [ ] Un usuario solo puede dejar una reseña por lugar, y solo puede editar o borrar las suyas
- [ ] El puntaje promedio y la cantidad de reseñas de cada lugar se mantienen actualizados automáticamente
- [ ] Un usuario comenta una reseña y marca reseñas como útiles
- [ ] Al abrir la página de un lugar, las reseñas y comentarios nuevos de otros usuarios aparecen sin recargar
- [ ] Un usuario denuncia una reseña; un moderador ve la cola de denuncias y puede ocultar la reseña
- [ ] Al recibir una denuncia, el sistema notifica al moderador desde una función del lado del servidor (esto se puede implementar como notificaciones, un log, una ruta donde se encolen)

## Modelo de datos mínimo sugerido

Es un punto de partida: pueden agregar tablas, pero no quitar relaciones ni restricciones.

| Tabla | Campos clave | Relaciones y restricciones |
| --- | --- | --- |
| `profiles` | id, nombre, avatar_url, rol (usuario, moderador, admin) | 1 a 1 con el usuario de Supabase Auth |
| `places` | id, nombre, categoría, descripción, dirección, promedio, cantidad_reseñas | Promedio y cantidad se actualizan por trigger o función |
| `reviews` | id, place_id, user_id, puntaje, texto, oculta | Un solo registro por par (place_id, user_id); puntaje entre 1 y 5 |
| `review_photos` | id, review_id, storage_path | Máximo 3 por reseña |
| `comments` | id, review_id, user_id, texto | Pertenece a una reseña y a un usuario |
| `review_votes` | review_id, user_id | Un voto de "útil" por usuario y reseña |
| `reports` | id, review_id, reportado_por, motivo, estado | Alimenta la cola de moderación |

## Requisitos técnicos

| Módulo | Requisito | Cómo se aplica en la plataforma de reseñas |
| --- | --- | --- |
| Next.js | App Router con al menos 3 niveles de rutas anidadas | Lugares, detalle de un lugar, detalle de una reseña |
| React / Next.js | Server Components y al menos un boundary de Suspense con estado de carga real | La página del lugar carga su ficha de inmediato y hace streaming de las reseñas |
| Next.js | Al menos una Server Action que cree o modifique datos, sin API route aparte | Publicar una reseña, comentar, marcar como útil |
| TypeScript | Tipado end-to-end sin `any`, con tipos generados desde el esquema de Supabase | Tipos de reviews, places y comments derivados de la base |
| Supabase Auth | Login funcional con `@supabase/ssr` y manejo de sesión | Registro, login y perfil de usuario |
| Supabase Auth | Al menos dos roles con permisos distintos | Usuario, moderador y admin con acciones diferentes |
| Base de datos | Modelo relacional con tablas vinculadas | Ver modelo sugerido |
| Base de datos | Row Level Security según rol y dueño del registro | Cada usuario edita solo sus reseñas; el moderador oculta cualquiera; las reseñas ocultas no se ven en el listado público |
| Storage | Carga de archivos con políticas de acceso | Fotos de reseñas y avatares, con límite de tamaño y tipo |
| Realtime | Una vista que se actualiza en vivo ante cambios de otro usuario | Nuevas reseñas y comentarios en la página del lugar |
| Edge Functions | Una función que resuelva algo que no corresponde al cliente | Notificar al moderador cuando llega una denuncia |
| Deployment | Deploy en Vercel con CI/CD que corra lint y build antes de mergear | Pipeline en el repositorio con checks obligatorios |
| Observabilidad | Implementar un logger mínimo a criterio del estudiante | Indicar en el README qué se decide loggear y por qué |

## Entregables

1. **Repositorio y deploy funcionando**: link al repositorio (no se revisa el historial de commits) y link a la app desplegada en Vercel.
2. **README documentado**, con:
   - Contexto de las decisiones tomadas a la hora de implementar (y cualquier detalle que consideren ayude a la corrección del proyecto)
   - Instrucciones de instalación para ejecutar el proyecto local
   - Diagrama del modelo de datos
   - Explicación de las políticas de RLS y por qué se eligieron (qué puede hacer cada rol)

> **¡Importante!** No compartir variables de entorno ni datos sensibles. Todos los archivos `.env` con ejemplos nada más.

## Criterio de aprobación

Para aprobar el trabajo final hace falta:

- Cumplir los requisitos técnicos
- Entregar el repositorio con deploy, el README y la demo
