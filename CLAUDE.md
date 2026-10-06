# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Resttek: restaurant management platform. npm-workspaces monorepo (`packages/*`): `api` (Express 5 + TypeScript + SQLite), three Angular 21 apps (`web-admin` :4200, `web-empleados` :4201, `web-clientes` :4202) and `web-shared` (shared Angular lib). Docs and README are in Spanish; detailed architecture lives in `docs/` (`arquitectura/`, `dominio/`).

## Commands (run from repo root)

```bash
npm install                # installs every workspace
npm run seed               # populate SQLite (idempotent, INSERT OR IGNORE); prints test credentials
npm run dev:api            # API on :3000 (tsx watch); GET /health
npm run dev:admin | dev:empleados | dev:clientes
npm test                   # API tests only (Vitest)
```

- Single test: `cd packages/api && npx vitest run src/services/order.service.test.ts` (add `-t "name"` to filter); watch mode: `npm run test:watch` in `packages/api`.
- Frontends: `npm run build -w @resttek/web-admin` (same for the others). There are no lint scripts and no frontend tests configured.
- Seed users: password equals the email (e.g. `admin@resttek.com`). Requires Node 22+.

## API architecture (`packages/api/src`)

Two coexisting styles — check which applies before editing:

- **Hexagonal + DDD, only `contexts/employee`** (domain / application use cases / infrastructure incl. `http/`). `Employee` is the only rich entity (private constructor + `create()`); value objects `Email` (in `contexts/shared`) and `Role`. Use cases are one class with `execute()`. Wiring lives in `infrastructure/http/dependencies.ts`.
- **Layered, for `restaurant`, `dish`, `ingredient`, `order`**: `models/` (plain interfaces + `normalizeX()` validators) → `repositories/` (interface + `Sqlite*Repository` in the same file) → `services/` → `controllers/` → `routes/`. Dependencies are composed inside each `*.routes.ts`. Routers under `/restaurants/:restaurantId/...` need `Router({ mergeParams: true })`.

Gotchas:
- Path aliases (`@models/*`, `@employee/*`, `@shared/*`, …) from `tsconfig.json`; imports must end in `.js` (ESM, `nodenext`).
- `Database` (`config/database.ts`) wraps sqlite3 with promises; schema is created by `CREATE TABLE IF NOT EXISTS` on `initialize()` (no migration tool). DB is `:memory:` when `NODE_ENV=test`, otherwise `packages/api/resttek.db`. `PRAGMA foreign_keys = ON` is set at init.
- Repositories alias columns `snake_case` → `camelCase` in SQL.
- `errorHandler` maps HTTP status by error **class name** (`AppError.name`): specific `*NotFoundError` → 404, `InvalidCredentialsError` → 401, other `AppError` → 400, else 500. Adding a new not-found error requires adding it to that list. `OrderController` handles its own errors (doesn't call `next`), so its status codes differ from the others.
- `authenticate`/`authorize` middlewares respond directly (401/403). Order routes have no `authorize()`.
- Creating an order expands `quantity: n` into n `order_items` rows of quantity 1 (per-unit status tracking).
- Tests are unit tests next to the code, using mocks in `repositories/mocks/` and `contexts/employee/application/mocks/`. No HTTP integration tests exist (`supertest` is installed but unused).
- Routes are all under `/api/v1` except `/health`.

## Frontend architecture

- Standalone components, signals, zoneless, functional guards/interceptors. `@resttek/web-shared` is consumed straight from source (`main: src/index.ts`, no build) — restart the dev server after changing it. It provides `API_URL` token, `AuthService`/`AuthStore`/`authGuard`, auth + error interceptors, and login/register components.
- Dev servers proxy `/api` to :3000 via `proxy.conf.json`.
- `web-admin` / `web-empleados`: feature folders (`pages/`, `services/`, `store/`, `models/`); components talk to signal-based Stores that wrap services with `firstValueFrom` (loading/error/data trio). `web-empleados` `OrderStore` polls every 30 s.
- `web-clientes` differs: models/services/stores centralized in `core/`; only `CartStore` is a real store; components subscribe to services directly and poll with `setInterval`.
- `docs/revisiones/` records known doc-vs-code inconsistencies from past reviews.
