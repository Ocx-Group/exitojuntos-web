# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copia archivos de dependencias primero (mejor caché de capas)
COPY package*.json ./

# Kaniko no soporta BuildKit mounts — capa normal para que Kaniko la cachee correctamente
RUN npm ci --legacy-peer-deps

# Copia archivos de configuración
COPY tsconfig*.json angular.json vite.config.ts ./

# Copia el código fuente
COPY src ./src

# Build de producción con más memoria y paralelización
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build:prod

# Stage 2: Production (imagen mínima)
FROM nginx:alpine-slim

# Copia la app compilada y la config de nginx
COPY --from=build /app/dist/main/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
