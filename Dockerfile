FROM node:18.12.1-alpine3.16

RUN apk add --no-cache mongodb-tools

ENV NODE_ENV "production"

WORKDIR /app

COPY package.json yarn.lock /app/

RUN yarn install --non-interactive --frozen-lockfile --check-files --production=true

COPY . /app/

ENTRYPOINT ["node", "./src/index.js"]
