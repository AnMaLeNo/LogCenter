# LogCenter

Application de centralisation de logs : backend **FastAPI**, frontend **React/Vite/TS**, stockage **OpenSearch**, le tout orchestré avec Docker Compose.

## Lancer le projet

```bash
cp .env.example .env
docker compose up -d --build
```

L'app est servie sur http://localhost:8080 (port configurable via `FRONTEND_PORT`).

### Mode développement (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Le serveur de dev Vite est servi sur http://localhost:5173.

## Configuration

Voir `.env.example` : connexion OpenSearch (`OPENSEARCH_HOST`, `OPENSEARCH_PORT`), nombre de résultats (`SEARCH_RESULTS_LIMIT`), ports (`FRONTEND_PORT`, `FRONTEND_DEV_PORT`, `BACKEND_PORT`).
