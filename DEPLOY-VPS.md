# VPS deployment

This setup runs the storefront, API, and admin dashboard in one Node.js process. Nginx terminates HTTPS and forwards both domains to the process:

| Host | Served application |
| --- | --- |
| `your-store.example.com` | Storefront and `/api/*` |
| `admin.your-store.example.com` | Admin dashboard |

MongoDB remains external (MongoDB Atlas is recommended). Do not expose MongoDB or port `3000` publicly.

## 1. Prepare the server

The commands below target Ubuntu 22.04/24.04:

```bash
sudo apt update
sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo adduser --system --group --home /var/www/dwarika dwarika
sudo mkdir -p /var/www/dwarika
sudo chown -R dwarika:dwarika /var/www/dwarika
```

Point both DNS records to the VPS:

```text
your-store.example.com       A    <VPS-IP>
admin.your-store.example.com A    <VPS-IP>
```

## 2. Install and build

```bash
sudo -u dwarika git clone https://github.com/Dataryx/Dwarika_Jewellers-.git /var/www/dwarika
cd /var/www/dwarika
sudo -u dwarika npm ci
sudo -u dwarika cp .env.example .env
sudo -u dwarika cp .env.admin.example .env.admin
```

Edit `.env` with production values:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=Dwarika
CUSTOMER_AUTH_SECRET=<long-random-secret>
ADMIN_AUTH_SECRET=<different-long-random-secret>
ALLOWED_ORIGINS=https://your-store.example.com,https://admin.your-store.example.com
ADMIN_BOOTSTRAP_PASSWORD=<one-time-password>
```

Edit `.env.admin` so the admin build calls the store domain:

```env
VITE_STOREFRONT_URL=https://your-store.example.com
VITE_API_URL=https://your-store.example.com
VITE_ADMIN_URL=https://admin.your-store.example.com
```

Build both static applications:

```bash
sudo -u dwarika npm run build:all
```

`ADMIN_BOOTSTRAP_PASSWORD` is only for the first admin account creation. Remove it from `.env` after the first successful login.

## 3. Run with systemd

```bash
sudo cp deploy/systemd/dwarika.service /etc/systemd/system/dwarika.service
sudo systemctl daemon-reload
sudo systemctl enable --now dwarika
sudo systemctl status dwarika
curl http://127.0.0.1:3000/api/health
```

Logs:

```bash
sudo journalctl -u dwarika -f
```

## 4. Configure Nginx and HTTPS

Replace the example domains in `deploy/nginx/dwarika.conf`, then install it:

```bash
sudo cp deploy/nginx/dwarika.conf /etc/nginx/sites-available/dwarika
sudo ln -s /etc/nginx/sites-available/dwarika /etc/nginx/sites-enabled/dwarika
sudo nginx -t
sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-store.example.com -d admin.your-store.example.com
```

Allow only SSH and web traffic:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 5. Verify

```bash
curl -I https://your-store.example.com/
curl https://your-store.example.com/api/health
```

Open `https://admin.your-store.example.com/login` and verify that browser requests go to `https://your-store.example.com/api/...`.

## Updating the application

```bash
cd /var/www/dwarika
sudo -u dwarika git pull --ff-only
sudo -u dwarika npm ci
sudo -u dwarika npm run build:all
sudo systemctl restart dwarika
```

Keep `.env` and `.env.admin` out of Git. Back up MongoDB separately; the VPS deployment does not create database backups.
