FROM node:24.14.0

WORKDIR /movy-api

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 5700

CMD [ "npm", "start" ]

