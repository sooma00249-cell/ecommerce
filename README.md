# Electronics E-commerce Store

MERN online store for electronics. One seller, one warehouse, own delivery drivers.
Customers order online; staff can also create orders on behalf of a customer.
Every stock change is recorded as a movement in an inventory ledger.

**Stack:** MongoDB (replica set) · Express · React (Vite + Tailwind) · Node.js (ES modules)

> The UI is bilingual: Arabic (RTL) + English.

---

## Requirements

| Tool    | Version   |
| ------- | --------- |
| Node.js | >= 20.11  |
| npm     | >= 10     |
| MongoDB | >= 7.0, running **as a replica set** |

---

## Project layout

```
.
├── server/                Node + Express + Mongoose API
│   ├── src/
│   │   ├── config/        env, db connection, logger
│   │   ├── middleware/    error handler
│   │   ├── modules/       one folder per domain module
│   │   ├── app.js         Express app (no port binding — importable in tests)
│   │   └── server.js      process entrypoint: listen + connect + shutdown
│   ├── .env.example
│   └── package.json
├── client/                React + Vite + Tailwind starter
│   ├── src/
│   ├── index.html
│   └── package.json
├── AGENTS.md
├── PROGRESS.md
└── README.md
```

---

## Install

```bash
# API server
cd server
cp .env.example .env      # then edit it
npm install

# Client
cd ../client
npm install
```

---

## Configure the server

All configuration lives in `server/.env` (git-ignored). Copy `server/.env.example`
and edit it:

| Variable       | Required | Description                                                |
| -------------- | -------- | ---------------------------------------------------------- |
| `PORT`         | yes      | API port. Default `5000`.                                   |
| `MONGO_URI`    | yes      | MongoDB connection string. **Must point at a replica set.** |
| `CORS_ORIGINS` | no       | Comma-separated browser origins allowed by CORS.            |
| `NODE_ENV`     | no       | `development` \| `test` \| `production`.                    |
| `LOG_LEVEL`    | no       | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace`. |

The process validates these at boot and refuses to start with a bad value.

---

## Running MongoDB as a replica set

Mongoose (and the inventory ledger's transactions) require a **replica set** — a
plain `mongod` started without `--replSet` will not work.

### Option A — local single-node replica set

Start `mongod` with a replica set name:

```bash
mkdir -p ./data/db ./data/log

mongod \
  --dbpath ./data/db \
  --logpath ./data/log/mongod.log \
  --replSet rs0 \
  --bind_ip 127.0.0.1 \
  --port 27017
```

Then initiate it **once** from a `mongosh` shell:

```bash
mongosh --eval 'rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "127.0.0.1:27017" }]
})'
```

Verify:

```bash
mongosh --eval 'rs.status().myState'   # 1 = PRIMARY, healthy
```

Then set:

```
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce?replicaSet=rs0
```

### Option B — MongoDB running on Windows, app running inside WSL

If your `mongod` lives on Windows and is already initiated as a replica set, WSL
can reach it through the Windows host IP:

```bash
# Find the Windows host IP from inside WSL
grep nameserver /etc/resolv.conf | awk '{print $2}'
```

Two things to watch out for:

1. **Use the Windows host IP, not `127.0.0.1`.** Inside WSL, `127.0.0.1` is WSL
   itself, where nothing is listening.
2. **Add `&directConnection=true`.** A replica set member advertises its own
   hostname as `me` (often `localhost:27017`). Without `directConnection`, the
   driver re-resolves that hostname *from inside WSL* and gets
   `ECONNREFUSED 127.0.0.1:27017`. `directConnection=true` makes the driver talk
   straight to the address you gave it, while still using the same server (so
   transactions keep working).

```
MONGO_URI=mongodb://<WINDOWS_HOST_IP>:27017/ecommerce?replicaSet=rs0&directConnection=true
```

Your `.env` changes whenever WSL restarts and the host IP changes — re-run the
`grep nameserver` command above and update `.env` if the connection stops.

### Option C — MongoDB Atlas

Create a free M0 cluster, allow your IP in Network Access, and use an SRV string:

```
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/ecommerce?retryWrites=true&w=majority
```

---

## Run

### API server

```bash
cd server
npm run dev        # auto-restart on change (node --watch)
npm start          # plain node, no watcher
```

### Client

```bash
cd client
npm run dev        # http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:5000`, so
the browser stays same-origin in development.

---

## Endpoints

| Method | Path      | Description                                                                |
| ------ | --------- | -------------------------------------------------------------------------- |
| GET    | `/`       | Service name + status.                                                      |
| GET    | `/health` | `{ status, db, uptime, timestamp }`. `200` when the DB is up, `503` when it is down. |

```bash
$ curl -s http://localhost:5000/health
{"status":"ok","db":"connected","uptime":73,"timestamp":"2026-10-12T13:42:50.163Z"}

$ curl -s http://localhost:5000/health      # database unreachable
{"status":"error","db":"disconnected","uptime":12,"timestamp":"..."}
```

---

## Error handling

Every error in the app is funnelled through one central handler
(`server/src/middleware/error.js`) and always returns this shape:

```json
{ "message": "Human-readable message" }
```

4xx responses may add a `details` field. 5xx responses never leak internals to
the client — the full error is written to the structured log instead.

Throw `ApiError.badRequest()`, `ApiError.notFound()`, `ApiError.conflict()`, …
from anywhere, or let `ZodError` / Mongoose errors propagate and they are mapped
automatically.

---

## Code quality

```bash
cd server && npm run lint        # ESLint
cd server && npm run format      # Prettier
cd client && npm run lint
cd client && npm run format
```

---

## Security & logging

- **helmet** sets security response headers.
- **cors** is restricted to the origins in `CORS_ORIGINS`.
- **pino** structured logs, with a `pino-pretty` transport in development.
  `Authorization` headers, cookies and anything named `password` are redacted.
- Request bodies are capped at 1 MB.
- `.env` is git-ignored; only `.env.example` (with placeholders) is committed.

---

## Contributing conventions

- One commit per step, message format: `step-N: short description`.
- Organise code by module: `src/modules/<name>/` holding `model`, `service`,
  `controller`, `routes`, `validation`.
- Validate all input with **Zod** and let the central handler format the error.
- Update `PROGRESS.md` at the end of every step.
