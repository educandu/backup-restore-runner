FROM node:18.12.1-alpine3.16

RUN apk add --no-cache mongodb-tools

WORKDIR /usr/app

COPY ./ ./

RUN yarn install --non-interactive --frozen-lockfile --check-files --production=true

ENTRYPOINT ["node", "./src/index.js"]
