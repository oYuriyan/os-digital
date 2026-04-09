# Estágio 1: Build da aplicação React
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Estágio 2: Subir servidor Nginx super leve para servir o HTML estático
FROM nginx:alpine

# Copiar o build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar a configuração do Nginx (necessário para SPA/roteamento)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
