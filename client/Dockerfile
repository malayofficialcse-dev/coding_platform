FROM node:20 as build

WORKDIR /app

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_API_PROXY_TARGET
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_API_PROXY_TARGET=$VITE_API_PROXY_TARGET

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
