FROM node:16-alpine

RUN apk add --no-cache mongodb-tools

WORKDIR /usr/app

COPY ./ ./

RUN npm install

ENTRYPOINT ["npm", "run"]
