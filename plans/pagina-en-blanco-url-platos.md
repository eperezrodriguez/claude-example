# Plan: Corregir página en blanco al entrar directamente en rutas anidadas de web-admin

**Tipo:** fix

**Origen:** GitHub issue #2 — Página en blanco al entrar en la url de platos

## Objetivo

Al abrir directamente una URL como `http://localhost:4200/restaurants/rest-2/dishes`, `web-admin` debe cargar y mostrar la página. Hoy `src/index.html` no tiene `<base href="/">`, a diferencia de `web-empleados` y `web-clientes`. Por eso el navegador pide `styles.css` y los scripts relativos a la ruta anidada (`/restaurants/rest-1/styles.css`) y recibe HTML.

## Tareas

Cada tarea debe poder hacerse en 5-10 minutos.

- [x] **T1.** Reproducir el fallo: arrancar `npm run dev:admin` y abrir directamente `/restaurants/rest-2/dishes` con sesión iniciada; anotar los 404 de `styles.css` y de los scripts en la consola — `packages/web-admin/src/index.html` (~5 min)
- [x] **T2.** Añadir `<base href="/">` dentro de `<head>`, antes de los `<link>`, igual que en los otros dos front — `packages/web-admin/src/index.html` (~5 min)
- [x] **T3.** Comprobar que `/restaurants/:id/dishes`, `/ingredients`, `/tables`, `/employees` y `/restaurants/new` cargan al entrar directamente y tras recargar (F5), y que la navegación desde el menú sigue funcionando — `packages/web-admin` (~10 min)
- [x] **T4.** Compilar con `npm run build -w @resttek/web-admin` y confirmar que el `index.html` generado incluye `<base href="/">` — `packages/web-admin` (~5 min)

## Criterios de aceptación

- [x] `GET http://localhost:4200/restaurants/rest-2/dishes` abierto directamente en el navegador, con sesión, muestra el listado de platos, sin página en blanco.
- [x] La consola no muestra el error "Refused to apply style ... MIME type ('text/html')" ni 404 de `styles.css` o de los scripts de la aplicación.
- [x] Las rutas `/restaurants/:id/ingredients`, `/tables`, `/employees` y `/restaurants/new` también cargan al entrar directamente y al recargar con F5.
- [x] `npm run build -w @resttek/web-admin` termina sin errores y `dist/.../index.html` contiene `<base href="/">`.
