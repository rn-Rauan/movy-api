FROM node:22.22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /movy-api

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL

RUN npm run build

EXPOSE 3001

CMD [ "npm", "run", "start:prod" ]

