# Project: Electronics E-commerce Store (MERN)

## About the project
An online store selling electronics (phones, laptops, more categories later).
- One seller (the owner). One warehouse. Own delivery drivers.
- Customers order online. Staff can also create an order on behalf of a customer.
- Every stock change must be recorded as a movement (inventory ledger).
- Payments: cash on delivery + bank transfer with receipt upload (later steps).
- UI: Arabic (RTL) + English.

## Tech stack (fixed, do not change)
MongoDB (replica set, Mongoose), Express, React (Vite + Tailwind), Node.js (ES modules).

## User roles (6)
owner, admin, manager, staff, delivery, customer.
Permissions will be stored in the database (RBAC), not hardcoded.

## Working rules (apply to EVERY step)
1. Do ONLY the step you are given. Do not implement future features.
2. One commit per step, message format: `step-N: short description`.
3. Never commit secrets. `.env` must be in `.gitignore`; provide `.env.example`.
4. Keep code organized by module: `src/modules/<name>/` (model, service, controller, routes, validation).
5. Validate all input (Zod). Use a central error handler.
6. Update `PROGRESS.md` at the end of each step: what was done, how to run, what is next.
7. Run the app (and tests if any) before finishing. Report any problem honestly.
8. If something is unclear, make the simplest reasonable choice and write it in `PROGRESS.md`.

---

## STEP 0 - Project setup (do only this)

Create a MERN monorepo:

```
/server   Node + Express + Mongoose
  src/config/        (db connection, env)
  src/middleware/    (error handler)
  src/modules/       (empty for now)
  src/app.js
  src/server.js
/client   React + Vite + Tailwind (empty starter app only)
README.md
PROGRESS.md
.gitignore
```

Requirements:
- `.env.example` with `PORT` and `MONGO_URI`.
- ESLint + Prettier configured.
- Security/logging basics: `helmet`, `cors`, `pino` logger.
- MongoDB connection must work with a **replica set** (document how to run one locally, or use Atlas).
- `GET /health` returns `{ "status": "ok", "db": "connected" }` with 200, or 503 with `db: "disconnected"` if the database is down.
- Central error handler middleware returning `{ message }` with the right status code.
- README with exact steps to install and run server and client.
- `PROGRESS.md` created.
- Do NOT implement authentication, products, or any other feature.

Commit as: `step-0: project setup`

## Acceptance criteria (the manager will check these)
- [ ] `npm run dev` in `/server` starts with no errors
- [ ] `/health` shows `status: ok` and `db: connected`
- [ ] No secrets in the repo; `.env` ignored; `.env.example` exists
- [ ] Folder structure matches the layout above
- [ ] Central error handler exists and is used
- [ ] README and PROGRESS.md are accurate
- [ ] Single clean commit for this step
