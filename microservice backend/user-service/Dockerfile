FROM node:18-alpine

WORKDIR /app

COPY user-service/package*.json ./user-service/
RUN cd user-service && npm install --omit=dev

COPY user-service/ ./user-service/
COPY shared/userSharding.js ./shared/userSharding.js

WORKDIR /app/user-service

EXPOSE 5002

CMD ["node", "src/index.js"]
