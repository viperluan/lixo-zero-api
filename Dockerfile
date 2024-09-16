# BUILD SITE
FROM node:20.16.0-bullseye AS api

WORKDIR /app

COPY . .

RUN npm install && npm run build

RUN npx prisma generate

# NGINX 
FROM nginx:latest

WORKDIR /app

COPY --from=api /app/dist .

COPY nginx/my_nginx.conf /etc/nginx/sites-available/
COPY nginx/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/sites-enabled/\
  && ln -s /etc/nginx/sites-available/my_nginx.conf /etc/nginx/sites-enabled/

CMD ["nginx", "-g", "daemon off;"]
