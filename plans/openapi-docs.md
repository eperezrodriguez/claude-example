# Plan: Documentación OpenAPI 3 en HTML interactivo

**Tipo:** feature

**Origen:** scripts/issues.json — Generar documentación con OpenAPI

## Objetivo

Generar un documento OpenAPI 3.0 con todos los endpoints de la API de Resttek y publicarlo como página HTML interactiva (Swagger UI por CDN), para poder explorarla y probarla. Todo queda en `docs/api-docs/`, sin tocar `packages/` ni añadir dependencias.

## Tareas

Cada tarea debe poder hacerse en 5-10 minutos.

- [x] **T1.** Crear la cabecera: `openapi: 3.0.3`, `info`, `servers` (`http://localhost:3000/api/v1`), `tags` y `securitySchemes` (bearerAuth JWT) — `docs/api-docs/openapi.yaml` (~5 min)
- [x] **T2.** Definir schemas de Restaurant, Dish e Ingredient a partir de `restaurant.model.ts`, `dish.model.ts`, `ingredient.model.ts` y `docs/dominio/modelo-datos.md` — `docs/api-docs/openapi.yaml` (~10 min)
- [x] **T3.** Definir schemas de Order, OrderItem y estados (`order.model.ts`), y de Employee, Role y credenciales de login/registro (`contexts/employee/`) — `docs/api-docs/openapi.yaml` (~10 min)
- [x] **T4.** Definir `components/responses` de error (400, 401, 403, 404) según `errorHandler.ts` y `middlewares.ts` — `docs/api-docs/openapi.yaml` (~5 min)
- [x] **T5.** Documentar `POST /auth/login` y `POST /auth/register` (`auth.routes.ts`, `AuthController.ts`) — `docs/api-docs/openapi.yaml` (~5 min)
- [x] **T6.** Documentar `/employees` (POST, GET, GET `/{id}`) y `/restaurants/{restaurantId}/employees` (GET), con roles — `docs/api-docs/openapi.yaml` (~8 min)
- [x] **T7.** Documentar `/restaurants` (POST, GET, GET `/{id}`, PUT `/{id}`) y `/public/restaurants` (GET, GET `/{id}`) — `docs/api-docs/openapi.yaml` (~10 min)
- [x] **T8.** Documentar `/restaurants/{restaurantId}/dishes` (CRUD) y `/public/restaurants/{restaurantId}/dishes` (GET) — `docs/api-docs/openapi.yaml` (~10 min)
- [x] **T9.** Documentar `/restaurants/{restaurantId}/ingredients` (CRUD) — `docs/api-docs/openapi.yaml` (~8 min)
- [x] **T10.** Documentar `/orders` (POST, GET `/active`, GET `/mine`, GET `/{id}`, PATCH `/{orderId}/items/{itemId}/status`) con los códigos de `order.controller.ts`, y `GET /health` — `docs/api-docs/openapi.yaml` (~10 min)
- [x] **T11.** Validar con `npx @redocly/cli lint` y corregir errores — `docs/api-docs/openapi.yaml` (~8 min)
- [x] **T12.** Crear `index.html` con Swagger UI (CDN, versión fijada) que cargue `./openapi.yaml`, con "Try it out" y `persistAuthorization` — `docs/api-docs/index.html` (~8 min)
- [x] **T13.** Probar con `npx serve docs/api-docs` contra la API en :3000: login y un GET protegido — `docs/api-docs/index.html` (~8 min)
- [ ] **T14.** Escribir un README en español: visualizar, validar y publicar (GitHub Pages u otro hosting estático) — `docs/api-docs/README.md` (~5 min)

## Criterios de aceptación

- [ ] `docs/api-docs/openapi.yaml` existe y declara `openapi: 3.0.3`.
- [ ] `npx @redocly/cli lint docs/api-docs/openapi.yaml` termina con 0 errores.
- [ ] Las 28 operaciones registradas en `packages/api/src/app.ts` y sus `*.routes.ts` aparecen en `paths` con el método y path correctos, más `/health`.
- [ ] Los endpoints protegidos declaran `security: bearerAuth`. `/auth/*`, `/public/*` y `/health` no lo declaran.
- [ ] Las operaciones con `authorize()` indican los roles permitidos y la respuesta 403.
- [ ] Servir `docs/api-docs/` con un servidor estático y abrir `index.html` muestra Swagger UI con todos los tags y endpoints, sin errores en consola.
- [ ] Con la API en :3000, `POST /auth/login` con `admin@resttek.com` desde "Try it out" devuelve 200. Tras autorizar con el token, `GET /restaurants` devuelve 200.
- [ ] `git diff --stat` no muestra cambios bajo `packages/`, y `npm test` sigue pasando.
