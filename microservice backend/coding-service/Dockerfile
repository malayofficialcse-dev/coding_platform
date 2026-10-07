FROM node:18-alpine

# Install Python and C++ compilers for local execution fallback
RUN apk add --no-cache python3 g++ make

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5007

CMD ["node", "src/index.js"]
