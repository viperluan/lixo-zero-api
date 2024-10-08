FROM node:20.17.0-alpine3.20

# Instala tzdata
RUN apk add --no-cache tzdata

# Define o fuso horário
ENV TZ=America/Sao_Paulo

# Cria link simbólico para o fuso horário e adiciona timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

RUN npx prisma generate

CMD ["npm", "run", "start:tsx"]
