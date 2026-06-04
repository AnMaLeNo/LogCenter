# syntax=docker/dockerfile:1

# --- Base stage: shared dependency layer ---
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- Development stage: Vite dev server with HMR ---
# Used by docker-compose.dev.yml. Source is bind-mounted at runtime so edits
# hot-reload instantly; no rebuild needed during development.
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- Build stage: compile the Vite app to static assets ---
FROM base AS build
COPY . .
RUN npm run build

# --- Runtime stage (default): serve static files + proxy /api with nginx ---
FROM nginx:1.27-alpine AS runtime

# Static build output
COPY --from=build /app/dist /usr/share/nginx/html

# Reverse-proxy config: serves the SPA at / and forwards /api -> backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
