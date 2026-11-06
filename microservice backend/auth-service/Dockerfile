FROM node:18-alpine

WORKDIR /app

COPY auth-service/package*.json ./auth-service/
RUN cd auth-service && npm install --omit=dev

COPY auth-service/ ./auth-service/
COPY shared/userSharding.js ./shared/userSharding.js

WORKDIR /app/auth-service

EXPOSE 5001

CMD ["node", "src/index.js"]
