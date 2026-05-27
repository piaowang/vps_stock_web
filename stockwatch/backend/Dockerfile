FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY src ./src

ENV AGG_PORT=8090
EXPOSE 8090

CMD ["npm", "start"]
