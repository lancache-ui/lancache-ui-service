FROM node:18-alpine3.17

WORKDIR /app

COPY ["package.json", "pnpm-lock.yaml*", "./"]

RUN npm install -g pnpm

RUN pnpm install 

COPY . .

RUN cp .env.example .env && mkdir -p /lancache/log && touch /lancache/log/access.log

EXPOSE 3002

CMD ["pnpm", "start"]