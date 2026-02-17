FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder" npx prisma generate

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/main.js"]
