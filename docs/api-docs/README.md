# Documentación de la API (OpenAPI 3)

Descripción OpenAPI 3.0.3 de la API de Resttek y una página HTML interactiva (Swagger UI) para explorarla y probarla.

| Fichero | Contenido |
| --- | --- |
| `openapi.yaml` | Especificación: 28 operaciones bajo `/api/v1` más `/health` |
| `index.html` | Página Swagger UI que carga `openapi.yaml` (assets por CDN, versión 5.34.0) |

## Ver la documentación

`index.html` carga `openapi.yaml` con `fetch`, así que no funciona abriéndolo con `file://`. Sírvelo con un servidor estático:

```bash
npx serve -l 5050 docs/api-docs
```

Abre http://localhost:5050 (el puerto 3000 lo usa la API).

## Probar los endpoints

1. Arranca la API: `npm run dev:api` (:3000) y puebla datos con `npm run seed`.
2. En la página, abre `POST /auth/login` → **Try it out** → **Execute** con `admin@resttek.com` / `admin@resttek.com`.
3. Copia el `token` de la respuesta, pulsa **Authorize** e introdúcelo. Se conserva al recargar.
4. Prueba cualquier endpoint protegido, por ejemplo `GET /restaurants`.

El servidor por defecto es `http://localhost:3000/api/v1`. Para apuntar a otro entorno, añade su URL en `servers` de `openapi.yaml`.

## Validar

```bash
npx @redocly/cli lint docs/api-docs/openapi.yaml
```

Debe terminar sin errores. Los avisos actuales son esperados (servidor `localhost`, sin campo `license`, endpoints públicos sin respuesta 4xx).

## Publicar

Es contenido estático: basta con servir la carpeta `docs/api-docs/`.

- **GitHub Pages:** publica la carpeta `docs/api-docs/` (por ejemplo con una acción de despliegue de Pages) y comparte la URL. Para que "Try it out" funcione contra una API desplegada, cambia `servers` en `openapi.yaml` a la URL pública de la API; la API ya permite CORS.
- **Otro hosting estático** (Netlify, S3, nginx...): sube `index.html` y `openapi.yaml` juntos.

## Mantenimiento

Cada vez que se añada, modifique o elimine un endpoint hay que actualizar `openapi.yaml` y volver a validarlo. La skill `plan-feature` ya incluye esa tarea en los planes que tocan la API.
