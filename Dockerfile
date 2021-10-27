FROM node:16-alpine

RUN apk add --no-cache mongodb-tools

WORKDIR /usr/app

COPY ./ ./

RUN npm ci

ENTRYPOINT ["npm", "run"]
