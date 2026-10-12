# Progress

## Step 0 — Project setup ✅

**Date:** 2026-10-12

### What was done

Created the MERN monorepo skeleton for the electronics e-commerce store.

**`/server` — Node + Express + Mongoose (ES modules)**

| File                                                | Purpose                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/config/env.js`                                  | Reads + validates `process.env` once at boot; fails fast on bad values. |
| `src/config/db.js`                                   | Mongoose connection, exposes live `dbState` for the health endpoint.     |
| `src/config/logger.js`                               | `pino` structured logger, `pino-pretty` in dev, secrets redacted.        |
| `src/middleware/error.js`                            | `ApiError` + central `errorHandler` + `notFoundHandler`.                 |
| `src/modules/health/health.controller.js`            | `GET /health` implementation.                                           |
| `src/modules/health/health.routes.js`                | Health router.                                                          |
| `src/app.js`                                         | Express app (helmet, cors, body parsing, logging, routes, error handler). |
| `src/server.js`                                      | Entrypoint: listen, connect with retry, graceful shutdown.               |

**`/client` — React + Vite + Tailwind**

Starter only: `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
(`@import "tailwindcss"`). Vite dev server proxies `/api` and `/health` to
`:5000`. Nothing feature-related was implemented.

**Repo**

- `README.md` — install/run steps, replica-set setup (3 options), endpoints.
- `PROGRESS.md` — this file.
- `.gitignore` — ignores `.env` (and `.env.*`), `node_modules`, `dist`, logs.
- `server/.env.example` — `PORT`, `MONGO_URI` + optional vars, no secrets.
- ESLint 10 (flat config) + Prettier configured in both `server/` and `client/`.
- Security/logging basics: `helmet`, `cors`, `pino` + `pino-http`.

### How to run

```bash
# 1. Install
cd server && cp .env.example .env && npm install
cd ../client && npm install

# 2. Point server/.env at a running replica set (see README for the 3 options)

# 3. API  → http://localhost:5000
cd server && npm run dev

# 4. Client → http://localhost:5173  (in a second terminal)
cd client && npm run dev
```

```bash
curl http://localhost:5000/health
# {"status":"ok","db":"connected","uptime":73,"timestamp":"2026-10-12T13:42:50.163Z"}
```

### Verified in this environment

- `npm run dev` in `/server` starts with no errors.
- `GET /health` → **200** `{"status":"ok","db":"connected"}`.
- `GET /health` with the database unreachable → **503** `{"status":"error","db":"disconnected"}`,
  and the process stays up, retrying every 5s (it does not crash).
- Unknown route → **404** `{"message":"Route GET /nope does not exist"}` (central handler).
- Malformed JSON body → **400** `{"message":"Malformed JSON body"}`.
- `npm run lint` and `npm run build` pass in both `/server` and `/client`.
- No secrets in the repo; `.env` is git-ignored, `.env.example` committed.
- A **real replica-set transaction** was run against the database to prove
  transactions work (needed for the inventory ledger in later steps).

### Decisions & notes

1. **MongoDB runs on Windows, the app runs in WSL.** The official MongoDB
   download server is geo-blocked from this network and there is no
   `mongod` installed inside WSL (and no sudo), so a local install was not
   possible. The existing Windows MongoDB — already a single-node replica set
   named `rs0` — is used instead.
   The replica set member advertises itself as `localhost:27017`, which inside
   WSL points at WSL and fails with `ECONNREFUSED 127.0.0.1:27017`.
   **Fix:** use the Windows host IP *and* `directConnection=true`.
   `server/.env` (git-ignored) currently contains:
   ```
   MONGO_URI=mongodb://172.18.192.1:27017/ecommerce?replicaSet=rs0&directConnection=true
   ```
   The Windows host IP changes when WSL restarts. If the connection breaks,
   re-run inside WSL and update `.env`:
   ```bash
   grep nameserver /etc/resolv.conf | awk '{print $2}'
   ```
   All three options (local replica set, WSL→Windows, Atlas) are documented in
   the README.
2. **`app.js` does not bind a port**; `server.js` does. This lets a future test
   suite import the Express app without opening a socket.
3. **The server starts listening before the DB is connected.** A downed
   database therefore produces an honest `503 db:disconnected` from `/health`
   rather than a process that refuses to boot. Connections are retried every 5s.
4. **The central error handler lives in `src/middleware/error.js`** and owns an
   `ApiError` class. `ZodError` and Mongoose's validation / duplicate-key /
   cast errors are mapped to the right status automatically, so modules in
   later steps only need to throw.
5. **No tests were written** — the step explicitly scopes out features, and no
   test runner was requested. `NODE_ENV=test` support (silent logs) is wired
   into `env.js` so a runner can be added without refactoring.
6. **Latest stable majors** were used: Express 5, Mongoose 9, Zod 4, React 19,
   Vite 7, Tailwind 4, ESLint 10, Prettier 3.

### What is next

Not implemented yet (and deliberately out of scope for step 0):
authentication, users/roles, RBAC permissions, products, inventory ledger,
orders, payments, and the Arabic/English UI.

The natural next step is **authentication + the user/role model**, since the
RBAC permission store is a prerequisite for everything staff-facing.

### Problems encountered (reported honestly)

- **MongoDB could not be installed inside WSL.** `fastdl.mongodb.org` returns
  `403 — CloudFront is configured to block access from your country`, no
  `mongod` package exists in the Ubuntu repos, and there is no sudo. Resolved
  by using the Windows-hosted MongoDB (see decision 1).
- **`mongodb-memory-server` was not usable** for the same reason: it downloads
  from the same geo-blocked host.
- **The MongoDB host IP is not stable across WSL restarts**, so `server/.env`
  may need updating between sessions. Documented in the README and above.
