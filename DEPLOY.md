# Deploying to AWS (single EC2 instance)

The cheapest viable setup: one EC2 instance running Postgres (pgvector),
the backend, and the frontend as three Docker containers via
`docker-compose.prod.yml`. No load balancer, no managed database, no
auto-scaling — good for a demo or low-traffic MVP, not for production
traffic or anything handling real customer data (see **Limitations** at
the end).

Everything below was built and smoke-tested locally against the exact
images this repo builds (migrations, admin login, FAQ seeding, and a real
RAG chat round-trip through Groq all verified working end-to-end).

## 1. Launch the instance

- AMI: **Ubuntu 22.04 LTS**
- Instance type: **t3.small** (2 vCPU / 2 GB). The frontend build briefly
  needs more headroom than 2 GB gives you alongside the running
  containers — add a 2 GB swapfile (step 3) so the build doesn't get
  OOM-killed. If you'd rather not bother with swap, use **t3.medium**
  instead (~2x the cost).
- Storage: default 20 GB gp3 is plenty.
- Security group inbound rules:
  - `22` (SSH) — restrict to your IP
  - `80` (HTTP, frontend) — `0.0.0.0/0`
  - `3001` (backend API) — `0.0.0.0/0`
- Allocate an **Elastic IP** and associate it with the instance. The
  frontend bakes the backend's URL into its build at compile time, so a
  stable IP matters — a plain public IP that changes on stop/start would
  break it.

## 2. Install Docker

SSH in, then:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## 3. (t3.small only) Add swap

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Get the code and configure

```bash
git clone https://github.com/mostchakkrit/sw-chatbot.git
cd sw-chatbot
cp .env.prod.example .env
nano .env   # fill in real values — see below
```

In `.env`, set:

- `POSTGRES_PASSWORD` — anything random
- `GROQ_API_KEY` — from console.groq.com
- `JWT_SECRET` — a long random string (`openssl rand -hex 32`)
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` / `ADMIN_SEED_NAME` — the
  first admin dashboard login
- `NEXT_PUBLIC_API_URL` — `http://<YOUR_ELASTIC_IP>:3001`. This gets
  compiled into the frontend bundle, so double-check it before building.

## 5. Build and start

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

The backend's first boot loads the local embedding model
(`Xenova/paraphrase-multilingual-MiniLM-L12-v2`); expect it to take
~30–60 seconds before it starts accepting requests. Watch it with:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

It's ready when you see `Nest application successfully started`. The
model is cached in a named volume, so this delay only happens once —
restarts afterward are fast.

## 6. One-time setup: admin user + FAQ knowledge base

```bash
docker compose -f docker-compose.prod.yml exec backend npm run seed:admin
docker compose -f docker-compose.prod.yml exec backend npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

`seed:admin` is safe to re-run (it upserts). The FAQ seed is a plain
insert — running it twice duplicates the starter FAQs, so only run it
once. Add more FAQs afterward through `/admin/faqs`.

## 7. Verify

- `http://<YOUR_ELASTIC_IP>/` — customer landing page + chat widget
- `http://<YOUR_ELASTIC_IP>/admin/login` — log in with your
  `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`
- `curl http://<YOUR_ELASTIC_IP>:3001/` → `Hello World!`

## Updating after a code change

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on backend startup (`docker-entrypoint.sh`
runs `prisma migrate deploy` before the app boots).

## Limitations of this setup

- **No HTTPS.** Admin login posts a password over plain HTTP. Fine for a
  demo behind a link you control; not fine for anything real. Fastest
  fix: point a domain at the Elastic IP and put
  [Caddy](https://caddyserver.com/) in front for automatic TLS.
- **No managed database / backups.** Postgres data lives in a Docker
  volume on one instance — if the instance is lost, so is the data.
- **No auto-scaling or health-check failover.** One instance, one point
  of failure.

If you outgrow this, the natural next step is RDS for PostgreSQL
(pgvector is supported on Postgres 15.2+/16+) plus ECS Fargate for the
two app containers behind an ALB — ask and I can set that up when you're
actually ready to pay for it.
