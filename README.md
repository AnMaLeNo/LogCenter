# LogCenter

Centralized log dashboard: **FastAPI** backend + **React/Vite/TS** frontend +
**OpenSearch** storage, orchestrated with Docker Compose.

## Architecture

- **frontend/** — React + Vite + Tailwind SPA. Calls its API at the relative
  path `/api` (never a hardcoded host), so the same build runs unchanged behind
  any reverse proxy.
- **backend/** — FastAPI service exposing `/logs` (create) and `/logs/search`.
- **opensearch-node** — OpenSearch single-node for log storage/search.

## Running

### Production (default)

The frontend is built to static assets and served by **nginx**, which also
proxies `/api` to the backend. This is what gets deployed.

```bash
cp .env.example .env       # first time only
docker compose up -d --build
```

The app is served at the frontend port (default `5173` -> container `:80`).

### Development (hot reload)

Use the dev override to run the **Vite dev server with HMR**. Source is
bind-mounted, so edits reload instantly with no rebuild. The Vite dev server
proxies `/api` to the backend just like nginx does in prod, so the relative API
calls behave identically in both modes.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Open http://localhost:5173 — edit files under `frontend/src/` and see changes
live.

> Switching modes: dev and prod use distinct image tags
> (`logcenter-frontend` vs `logcenter-frontend-dev`), so you can switch back and
> forth without forcing a rebuild each time.

## Configuration

See `.env.example`. Key vars:

- `OPENSEARCH_HOST` / `OPENSEARCH_PORT` — backend -> OpenSearch connection.
- `SEARCH_RESULTS_LIMIT` — max search hits returned.
- `FRONTEND_PORT` / `BACKEND_PORT` — host port mappings.
- `VITE_API_BASE_URL` — leave empty to use the relative `/api` default
  (recommended; keeps the build deployment-agnostic).

## Deployment behind a reverse proxy

The base compose is reverse-proxy-agnostic. For Traefik-based subdomain
routing, see `docker-compose.override.yml.example` (copy to
`docker-compose.override.yml`, which is gitignored as a server-specific detail).
