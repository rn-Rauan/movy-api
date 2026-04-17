FROM node:22.22

WORKDIR /movy-api

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate && npm run build

EXPOSE 3001

CMD [ "npm", "start" ]

