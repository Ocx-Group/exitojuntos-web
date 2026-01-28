# Stage 1: Build
FROM node:22-alpine AS build

# Instalar dependencias del sistema necesarias para compilación
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia archivos de dependencias primero (mejor caché)
COPY package*.json ./

# Instala dependencias con caché de npm montado
RUN --mount=type=cache,target=/root/.npm \
  npm ci --legacy-peer-deps --prefer-offline

# Copia archivos de configuración
COPY tsconfig*.json angular.json vite.config.ts ./

# Copia el código fuente
COPY src ./src

# Build de producción con más memoria y paralelización
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build:prod

# Stage 2: Production (imagen mínima)
FROM nginx:alpine-slim

# Eliminar contenido por defecto
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copia la app compilada
COPY --from=build /app/dist/main/browser /usr/share/nginx/html

# Configuración de nginx para SPA con compresión
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
