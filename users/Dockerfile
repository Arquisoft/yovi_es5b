FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --silent

ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD

ENV DB_NAME=$DB_NAME
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD

COPY . .
EXPOSE 3000
CMD ["node", "users-service.js"]
