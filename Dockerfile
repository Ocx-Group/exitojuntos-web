# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala dependencias una sola vez
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copia archivos necesarios para build
COPY tsconfig*.json angular.json vite.config.ts ./
COPY src ./src

# Build de producción
RUN npm run build:prod

# Stage 2: Production
FROM nginx:alpine

# Copia configuración optimizada de nginx
RUN rm -rf /usr/share/nginx/html/* && \
  rm /etc/nginx/conf.d/default.conf

# Copia la app compilada
COPY --from=build /app/dist/main/browser /usr/share/nginx/html

# Configuración de nginx para SPA
RUN echo 'server { \
  listen 80; \
  location / { \
  root /usr/share/nginx/html; \
  index index.html; \
  try_files $uri $uri/ /index.html; \
  } \
  gzip on; \
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
  }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
