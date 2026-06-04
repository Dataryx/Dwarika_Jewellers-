# Deploy admin dashboard (Vercel)

Admin is a **second Vercel project** from the same repo. It is static (`dist-admin`) and calls the **store** project for `/api/*`.

## 1. Create the Vercel project

1. [vercel.com/new](https://vercel.com/new) → import **Dataryx/dwarika-store** or **Dataryx/Dwarika_Jewellers-** (same repo as the store).
2. Name it e.g. **dwarika-admin** (do not reuse the store project).
3. **Build & Development Settings** — override defaults:

| Setting | Value |
|---------|--------|
| Framework Preset | Vite (or Other) |
| Build Command | `npm run build:admin` |
| Output Directory | `dist-admin` |
| Install Command | `npm ci` |

4. Leave **Root Directory** empty (repo root).

> Alternative: CLI from repo root:  
> `npx vercel --prod --local-config vercel.admin.json`

## 2. Environment variables (admin project)

Import **`.env.admin1`** or add manually:

```env
DWARIKA_APP=admin
VITE_STOREFRONT_URL=https://dwarika-jewellers.vercel.app
VITE_API_URL=https://dwarika-jewellers.vercel.app
VITE_ADMIN_URL=https://admin-blond-tau-57.vercel.app
```

`DWARIKA_APP=admin` is **required** — without it the repo builds the storefront (`Dwarika | Luxury Jewelry`) instead of the admin panel.

Scope: **Production** (and Preview if needed).

Deploy once. Note the admin URL, e.g. `https://dwarika-admin.vercel.app`.

## 3. Update the store project (CORS)

On the **store** Vercel project (`dwarika-jewellers`), edit **`ALLOWED_ORIGINS`**:

```env
ALLOWED_ORIGINS=https://dwarika-jewellers.vercel.app,https://YOUR-ADMIN.vercel.app
```

Redeploy the **store** after saving.

## 4. First admin login

On the **store** project, add (one time):

```env
ADMIN_BOOTSTRAP_PASSWORD=YourSecurePass1!
```

(Rules: 8+ chars, upper, lower, number, special character.)

Redeploy **store**, then open:

`https://YOUR-ADMIN.vercel.app/login`

- Email: `admin@dwarika.com`
- Password: the bootstrap password

Remove `ADMIN_BOOTSTRAP_PASSWORD` from the store after login works.

## 5. Verify

- `https://YOUR-ADMIN.vercel.app/login` loads
- After login, Network tab shows API calls to `https://dwarika-jewellers.vercel.app/api/...` (not `localhost`)
- `https://dwarika-jewellers.vercel.app/api/health` returns `{"ok":true,...}`

## Local test before Vercel

```bash
cp .env.admin.example .env.admin
npm run build:admin
npm run preview:admin
```

Open http://localhost:5174/login

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Admin blank / API errors | Set `VITE_API_URL` on **admin** to store URL; **redeploy admin** |
| Login CORS failed | Add admin URL to store `ALLOWED_ORIGINS`; redeploy **store** |
| 404 on refresh | `vercel.admin.json` rewrites should be applied (SPA) |
| Wrong API host in build | Env vars only apply at build time — change env → **redeploy admin** |
