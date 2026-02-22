FROM node:22-alpine
WORKDIR /app

# curl para que el Health Check de Docker
RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .
EXPOSE 3000
CMD ["node", "users-service.js"]
