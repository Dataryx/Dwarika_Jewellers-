# Deploying Dwarika (Storefront + Admin)

This repo ships **two separate frontends** from one Git repository. Deploy them as **two Vercel projects**:

| App | URL example | Build | Output | Backend |
|-----|-------------|-------|--------|---------|
| **Storefront** (customers) | `https://your-store.com` | `npm run build` | `dist` | Yes - `/api/*` |
| **Admin dashboard** | `https://admin.your-store.com` | `npm run build:admin` | `dist-admin` | No - calls store API |

```
  Customer browser                    Admin browser
        │                                   │
        ▼                                   ▼
  your-store.com                   admin.your-store.com
        │                                   │
        ├── Storefront SPA (dist)           └── Admin SPA (dist-admin)
        └── /api/*  ◄──────────────────────────── adminFetch()
                    │
                    ▼
              MongoDB Atlas
```

---

## Prerequisites

1. **MongoDB Atlas** cluster with a connection string (`MONGODB_URI`).
2. **Atlas Network Access** - allow Vercel (e.g. `0.0.0.0/0` during setup; tighten later if needed).
3. Code pushed to **GitHub** (or GitLab/Bitbucket) and linked to Vercel.

### One-time database setup (run locally against Atlas)

```bash
cp .env.example .env
# Edit .env with your MONGODB_URI and MONGODB_DB_NAME

npm install
npm run mongo:setup
npm run seed:smtp   # optional - or configure SMTP in Admin → SMTP after deploy
```

---

## Project 1 - Storefront + API

### Create the Vercel project

1. [vercel.com/new](https://vercel.com/new) → import this repository.
2. Name it e.g. **dwarika-store**.
3. Framework: **Vite** (auto-detected).
4. Use settings from `vercel.json`:

   | Setting | Value |
   |---------|--------|
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm ci` |

5. Deploy.

The `api/` folder is deployed automatically as **Vercel Serverless Functions** at `/api/*`.

### Environment variables (Vercel → Settings → Environment Variables)

Set these on the **store** project for **Production** (and Preview if you use preview URLs).

**Required - API / database**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | Database name (e.g. `Dwarika`) |

**Required - customer auth**

| Variable | Description |
|----------|-------------|
| `CUSTOMER_AUTH_SECRET` | Long random string for signing customer login tokens (optional in dev; **required in production**) |

**Optional**

| Variable | Description |
|----------|-------------|
| `SMTP_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME` | SMTP fallback; prefer **Admin → SMTP** (saved in MongoDB) |
| `RAPIDAPI_KEY` | Optional Nepal gold/silver rates API |
| `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_AUTH_PROXY` | Google OAuth |

> **Security:** Prefer Vercel dashboard env vars over hardcoding secrets in `vercel.json`. Remove committed secrets from `vercel.json` when you move them to the dashboard.

### Verify storefront

After deploy, open:

- `https://<your-store>.vercel.app/` - homepage
- `https://<your-store>.vercel.app/api/settings` - should return JSON

Note your **production store URL** - the admin project needs it next.

---

## Project 2 - Admin dashboard

### Create the second Vercel project

1. Import the **same repository** again (new project).
2. Name it e.g. **dwarika-admin**.
3. Use settings from `vercel.admin.json`:

   | Setting | Value |
   |---------|--------|
   | Build Command | `npm run build:admin` |
   | Output Directory | `dist-admin` |
   | Install Command | `npm ci` |

   Or deploy via CLI with the admin config:

   ```bash
   vercel --prod --local-config vercel.admin.json
   ```

### Environment variables (build-time - required)

Admin reads these at **build** time (`vite build --mode admin` loads `.env.admin` locally; on Vercel set them in the dashboard).

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `https://your-store.vercel.app` | Where admin sends `/api/*` requests |
| `VITE_STOREFRONT_URL` | `https://your-store.vercel.app` | “View store” links in admin |

Replace with your **Project 1** URL (or custom domain after you add one).

> If you change these URLs, **redeploy the admin project** so the new values are baked into the static build.

### Verify admin

- `https://<your-admin>.vercel.app/login` - admin login
- After login, open Products or Orders - Network tab should show requests to `VITE_API_URL/api/...`, not `localhost`.

---

## Custom domains

| Project | Suggested domain |
|---------|------------------|
| Store | `www.dwarika.com` or `dwarika.com` |
| Admin | `admin.dwarika.com` |

After attaching domains:

1. Update **admin** env vars to the final store URL and **redeploy admin**.
2. Configure **SMTP** in Admin → SMTP for order receipts and password reset emails.

---

## Local development

```bash
npm run dev
```

| App | URL |
|-----|-----|
| Storefront | http://localhost:5173 |
| Admin | http://localhost:5174/login |

Both use local `/api/*` via the Vite dev plugin. Copy `.env.example` → `.env` for MongoDB.

For a local admin production build test:

```bash
cp .env.admin.example .env.admin
# Set VITE_API_URL and VITE_STOREFRONT_URL to http://localhost:5173
npm run build:admin
npm run preview:admin
```

---

## Deployment checklist

```text
□ MongoDB Atlas network access allows Vercel
□ npm run mongo:setup run against Atlas
□ Store Vercel project deployed (build → dist)
□ Store env: MONGODB_URI, MONGODB_DB_NAME, CUSTOMER_AUTH_SECRET
□ /api/settings returns JSON on production store URL
□ Admin Vercel project deployed (build:admin → dist-admin)
□ Admin env: VITE_API_URL + VITE_STOREFRONT_URL = store URL
□ Admin login works; API calls hit store domain
□ SMTP configured in Admin → SMTP (order receipts + password reset)
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `tsc: Permission denied` (exit 126) on Vercel | **`node_modules` must not be in Git.** Run `git rm -r --cached node_modules`, commit, push. Vercel runs `npm ci` on Linux and needs fresh deps. |
| Admin empty / API errors | Set `VITE_API_URL` to the **store** URL; redeploy admin |
| `MONGODB_URI is not set` | Add env vars to **store** project; redeploy store |
| Mongo connection timeout | Atlas → Network Access → allow Vercel IPs |
| Customer login fails in prod | Set `CUSTOMER_AUTH_SECRET` on Vercel; configure SMTP for password reset |
| SMTP works locally, not on Vercel | Configure in Admin → SMTP (MongoDB), use Gmail App Password |
| 404 on admin refresh | `vercel.admin.json` rewrites are correct (`/(.*)` → `/index.html`) |

---

## Optional: two Git repositories

You do **not** need two repos for separate hosting. One repo + two Vercel projects is enough.

Split into two repos only if different teams need fully independent release cycles. Then:

- **Store repo:** storefront source + entire `api/` folder + `vercel.json`
- **Admin repo:** `src/Admin/`, `admin/`, admin pages, `vite.admin.config.ts`, `vercel.admin.json`

The admin repo still calls the store’s `/api` URL via `VITE_API_URL`.

---

## Quick reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Store (5173) + admin (5174) together |
| `npm run build` | Production storefront → `dist` |
| `npm run build:admin` | Production admin → `dist-admin` |
| `npm run build:all` | Both builds locally |
| `npm run mongo:setup` | Init collections + seed data |

Config files: `vercel.json` (store), `vercel.admin.json` (admin), `.env.example` (store/API), `.env.admin.example` (admin build).
