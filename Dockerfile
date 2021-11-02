FROM node:16.13.0-alpine3.11

RUN apk add --no-cache mongodb-tools

WORKDIR /usr/app

COPY ./ ./

RUN npm install

ENTRYPOINT ["node", "./src/index.js"]
