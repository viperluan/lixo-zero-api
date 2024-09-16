FROM node:20.17.0-alpine3.20

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

RUN npx prisma generate

CMD ["npm", "start"]
