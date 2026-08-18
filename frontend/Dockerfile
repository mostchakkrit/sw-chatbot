FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
# Next.js standalone server.js binds to process.env.HOSTNAME. Docker/Railway
# inject HOSTNAME as the container id, which often does not resolve inside the
# container (getaddrinfo ENOTFOUND), crashing the server at boot. Force 0.0.0.0.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
