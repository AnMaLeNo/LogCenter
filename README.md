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

### Simulateur de logs

Génère un flux de logs en continu vers `POST /logs`, utile pour voir le temps réel.

```bash
SIMULATOR_RATE=5 docker compose -f docker-compose.yml -f docker-compose.simulator.yml up --build simulator
```

`SIMULATOR_RATE` règle le nombre de logs par seconde (défaut : 1).

## Configuration

Voir `.env.example` : connexion OpenSearch (`OPENSEARCH_HOST`, `OPENSEARCH_PORT`), nombre de résultats (`SEARCH_RESULTS_LIMIT`), ports (`FRONTEND_PORT`, `FRONTEND_DEV_PORT`, `BACKEND_PORT`).
