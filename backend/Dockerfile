# Debian-based, not alpine: onnxruntime-node (used by @huggingface/transformers
# for local embeddings) ships prebuilt binaries linked against glibc, which
# alpine's musl libc cannot load.
FROM node:20-bookworm-slim

WORKDIR /app

# Prisma's query engine needs to detect the OpenSSL version at build time;
# without it installed it silently defaults to the wrong engine binary.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
