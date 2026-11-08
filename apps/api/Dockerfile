FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.28.0
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter api...
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN pnpm --filter api build
WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma:deploy && pnpm start:prod"]
