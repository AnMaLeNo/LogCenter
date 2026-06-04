# syntax=docker/dockerfile:1

# --- Build stage: compile the Vite app to static assets ---
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage: serve static files + proxy /api with nginx ---
FROM nginx:1.27-alpine AS runtime

# Static build output
COPY --from=build /app/dist /usr/share/nginx/html

# Reverse-proxy config: serves the SPA at / and forwards /api -> backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
