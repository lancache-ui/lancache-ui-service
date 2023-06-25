FROM node:18-alpine

RUN npm i -g pnpm
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
COPY ["pnpm-lock.yaml", "pnpm-lock.yaml*", "./"]
RUN pnpm install
COPY . .

# RUN pnpm build
# RUN pnpm prune --prod
CMD ["pnpm", "start"]