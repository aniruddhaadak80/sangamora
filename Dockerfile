# ─────────────────────────────────────────────────────────────────────────────
# sangamora — container build for the Next 16 + Turbopack web sandbox.
#
#   docker build -t sangamora .
#   docker run -p 3000:3000 -e MELA_SEED=7331 sangamora
#
# Notes
# ─────
# • apps/web does NOT enable `output: "standalone"`, so the runtime stage keeps
#   the full `node_modules` next to `.next` and boots with the Next CLI
#   (`node node_modules/next/dist/bin/next start`).
# • Bun 1.3.14 does install/build (matches packageManager); plain Node 22 runs
#   the server — no Bun needed at runtime.
# • Runs as the non-root `node` user; HEALTHCHECK pings /api/healthz.
#   (A .dockerignore trimming node_modules/.git would shrink context — owned
#   by the orchestrator, adjust there.)
# ─────────────────────────────────────────────────────────────────────────────

# ── stage 1: deps + build (Bun, root workspace) ──────────────────────────────
FROM oven/bun:1.4.4 AS builder

WORKDIR /app

# Full-tree copy: the Bun workspace spans apps/*, packages/*, examples/*, and
# bun.lock --frozen-lockfile needs every workspace manifest present.
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

# ── stage 2: runtime (Node, non-root) ────────────────────────────────────────
FROM node:22-slim AS runner

# wget powers the container HEALTHCHECK below (slim images ship without it).
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /app .

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
