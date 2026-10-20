# Dwarika Jewellers VPS Hosting Steps

This guide deploys the storefront, API, and admin dashboard on one Ubuntu VPS.

Recommended architecture:

```text
Customer domain                 Admin domain
your-store.com                  admin.your-store.com
      |                                  |
      +---------- HTTPS / Nginx --------+
                         |
                    Node.js app
                    127.0.0.1:3000
                         |
                    MongoDB Atlas
```

The Node.js app serves:

- Storefront from `dist`
- Admin dashboard from `dist-admin`
- API routes from `/api/*`

Do not expose port `3000` or MongoDB directly to the public internet.

---

## 1. Requirements

You need:

- An Ubuntu 22.04 or Ubuntu 24.04 VPS
- A VPS public IPv4 address
- A domain name
- Two DNS records:
  - `your-store.com`
  - `admin.your-store.com`
- A MongoDB Atlas account and cluster
- SSH access to the VPS
- The GitHub repository URL

The VPS should have at least:

- 1 GB RAM for a small deployment
- 20 GB disk space
- 1 vCPU or more

---

## 2. Configure DNS

At your domain provider, create these records:

```text
Type   Name    Value
A      @       <VPS_PUBLIC_IP>
A      admin   <VPS_PUBLIC_IP>
```

If your provider does not support `@`, use the root domain name instead.

Wait for DNS propagation. You can check from your computer:

```bash
nslookup your-store.com
nslookup admin.your-store.com
```

Both records should resolve to the VPS IP address.

---

## 3. Connect to the VPS

From your computer:

```bash
ssh root@<VPS_PUBLIC_IP>
```

If your VPS provider gives you a different username, use that username instead.

Update Ubuntu:

```bash
apt update
apt upgrade -y
```

Create a non-root deployment user:

```bash
adduser --system --group --home /var/www/dwarika dwarika
mkdir -p /var/www/dwarika
chown -R dwarika:dwarika /var/www/dwarika
```

---

## 4. Install required software

Install Git, Nginx, and firewall tools:

```bash
apt install -y git nginx ufw curl
```

Install Node.js 22:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

Verify:

```bash
node --version
npm --version
nginx -v
```

---

## 5. Set up MongoDB Atlas

MongoDB Atlas is recommended because the database is managed separately from the VPS.

### Create the cluster

1. Open [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create an account or sign in.
3. Create a project.
4. Create a cluster.
5. Choose a region close to the VPS.
6. Select a suitable cluster size.

### Create a database user

In Atlas:

1. Open **Database Access**.
2. Create a database user.
3. Use a strong password.
4. Grant read and write access to the application database.

Save the username and password securely.

### Allow the VPS IP address

In Atlas:

1. Open **Network Access**.
2. Add the VPS public IP address.
3. Use `<VPS_PUBLIC_IP>/32`.

Avoid using `0.0.0.0/0` in production unless absolutely necessary.

### Get the connection string

In Atlas:

1. Open **Database**.
2. Click **Connect**.
3. Choose **Drivers**.
4. Select Node.js.
5. Copy the MongoDB connection string.

It will look similar to:

```text
mongodb+srv://<username>:<password>@cluster.example.mongodb.net/?retryWrites=true&w=majority
```

URL-encode special characters in the database password. For example, `@` becomes `%40`.

---

## 6. Download the application

Switch to the application user:

```bash
su -s /bin/bash dwarika
cd /var/www/dwarika
```

Clone the repository:

```bash
git clone https://github.com/Dataryx/Dwarika_Jewellers-.git .
```

Install exact dependency versions:

```bash
npm ci
```

---

## 7. Create production environment files

Create the server environment file:

```bash
cp .env.example .env
nano .env
```

Set values similar to the following:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=Dwarika

CUSTOMER_AUTH_SECRET=<long-random-secret>
ADMIN_AUTH_SECRET=<different-long-random-secret>

ALLOWED_ORIGINS=https://your-store.com,https://admin.your-store.com

ADMIN_BOOTSTRAP_PASSWORD=<temporary-secure-password>
```

Generate strong secrets with:

```bash
openssl rand -base64 48
```

Use different values for `CUSTOMER_AUTH_SECRET` and `ADMIN_AUTH_SECRET`.

The `ADMIN_BOOTSTRAP_PASSWORD` value is used only to create the initial admin account. Remove it after the first successful admin login.

Create the admin build environment file:

```bash
cp .env.admin.example .env.admin
nano .env.admin
```

Set:

```env
VITE_STOREFRONT_URL=https://your-store.com
VITE_API_URL=https://your-store.com
VITE_ADMIN_URL=https://admin.your-store.com
```

Protect the environment files:

```bash
chmod 600 .env .env.admin
```

Never commit these files to GitHub.

---

## 8. Initialize MongoDB collections and seed data

Run the database setup using the production environment:

```bash
npm run mongo:setup
```

Optionally configure the SMTP seed:

```bash
npm run seed:smtp
```

Alternatively, configure SMTP later from the Admin dashboard.

---

## 9. Build the application

Build both the storefront and admin dashboard:

```bash
npm run build:all
```

Verify the output:

```bash
test -f dist/index.html
test -f dist-admin/index.html
```

If either file is missing, do not continue until the build succeeds.

---

## 10. Test the production server locally

Start the application:

```bash
HOST=127.0.0.1 PORT=3000 npm start
```

Open another SSH session and test:

```bash
curl -I http://127.0.0.1:3000/
curl http://127.0.0.1:3000/api/ping
curl -H "Host: admin.your-store.com" -I http://127.0.0.1:3000/login
```

The API ping response should contain:

```json
{
  "ok": true
}
```

Stop the temporary server with `Ctrl+C`.

---

## 11. Configure systemd

Exit back to the root user if necessary:

```bash
exit
```

Copy the included service file:

```bash
cp /var/www/dwarika/deploy/systemd/dwarika.service /etc/systemd/system/dwarika.service
```

The service runs:

```text
/usr/bin/node /var/www/dwarika/server.mjs
```

Enable and start it:

```bash
systemctl daemon-reload
systemctl enable --now dwarika
systemctl status dwarika
```

Check application logs:

```bash
journalctl -u dwarika -f
```

Check the local API:

```bash
curl http://127.0.0.1:3000/api/health
```

The health endpoint should report that MongoDB is connected.

---

## 12. Configure Nginx

Edit the included Nginx configuration:

```bash
nano /var/www/dwarika/deploy/nginx/dwarika.conf
```

Replace:

```text
your-store.example.com
admin.your-store.example.com
```

with your real domains.

Install the configuration:

```bash
cp /var/www/dwarika/deploy/nginx/dwarika.conf /etc/nginx/sites-available/dwarika
ln -s /etc/nginx/sites-available/dwarika /etc/nginx/sites-enabled/dwarika
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Test HTTP:

```bash
curl -I http://your-store.com
curl -I http://admin.your-store.com
```

Both domains should return the application.

---

## 13. Enable HTTPS with Let's Encrypt

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Request certificates:

```bash
certbot --nginx \
  -d your-store.com \
  -d admin.your-store.com
```

Choose the option to redirect HTTP to HTTPS.

Verify:

```bash
certbot certificates
curl -I https://your-store.com
curl -I https://admin.your-store.com
```

Test automatic renewal:

```bash
certbot renew --dry-run
```

---

## 14. Configure the firewall

Allow SSH and HTTPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Do not open port `3000`. The Node.js server listens only on `127.0.0.1`.

---

## 15. Create the first admin account

1. Open:

   ```text
   https://admin.your-store.com/login
   ```

2. Log in using:

   ```text
   Email: admin@dwarika.com
   Password: <ADMIN_BOOTSTRAP_PASSWORD>
   ```

3. Confirm that admin API requests go to:

   ```text
   https://your-store.com/api/...
   ```

4. Remove the bootstrap password:

   ```bash
   nano /var/www/dwarika/.env
   ```

   Delete or comment out:

   ```env
   ADMIN_BOOTSTRAP_PASSWORD=...
   ```

5. Restart the application:

   ```bash
   systemctl restart dwarika
   ```

---

## 16. Verify the deployment

### Storefront

Open:

```text
https://your-store.com
```

Confirm that:

- The homepage loads.
- Product data loads.
- Images load.
- The browser console has no API URL errors.

### API

```bash
curl https://your-store.com/api/ping
curl https://your-store.com/api/health
```

### Admin dashboard

Open:

```text
https://admin.your-store.com/login
```

Confirm that:

- Login works.
- Products can be viewed and edited.
- Orders can be viewed.
- API requests use the storefront domain.

### Logs

```bash
systemctl status dwarika
journalctl -u dwarika --since "10 minutes ago"
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 17. Updating the application

Run these commands after pushing a new version:

```bash
su -s /bin/bash dwarika
cd /var/www/dwarika
git pull --ff-only
npm ci
npm run build:all
exit
systemctl restart dwarika
systemctl status dwarika
```

Check logs after every update:

```bash
journalctl -u dwarika -n 100 --no-pager
```

If the update fails, do not delete the previous build until the problem is understood.

---

## 18. MongoDB backups

Atlas backups should be enabled for production.

Recommended:

1. Open the Atlas project.
2. Open the cluster's **Backup** section.
3. Enable continuous backup or scheduled snapshots.
4. Confirm the backup retention period.
5. Test restoring a backup to a separate database or cluster.

You can also create a manual backup from a trusted machine with `mongodump`:

```bash
mongodump \
  --uri "mongodb+srv://<username>:<password>@cluster.example.mongodb.net/Dwarika" \
  --out ./mongo-backup
```

Store backups outside the VPS and protect them with encryption and access controls.

---

## 19. Security checklist

- [ ] SSH key authentication is configured.
- [ ] Root SSH login is disabled after confirming the normal user works.
- [ ] A non-root deployment user runs the application.
- [ ] `.env` and `.env.admin` have permissions `600`.
- [ ] MongoDB Atlas allows only the VPS IP address.
- [ ] `CUSTOMER_AUTH_SECRET` and `ADMIN_AUTH_SECRET` are different.
- [ ] `ADMIN_BOOTSTRAP_PASSWORD` was removed after first login.
- [ ] HTTPS is enabled for both domains.
- [ ] UFW allows only SSH and Nginx.
- [ ] Port `3000` is not publicly exposed.
- [ ] MongoDB Atlas backups are enabled.
- [ ] System and Node.js packages are updated regularly.

---

## 20. Common problems

### `502 Bad Gateway`

Check whether the Node service is running:

```bash
systemctl status dwarika
journalctl -u dwarika -n 100 --no-pager
```

Test it directly:

```bash
curl http://127.0.0.1:3000/api/ping
```

### MongoDB connection fails

Check:

- `MONGODB_URI` is correct.
- The MongoDB password is URL-encoded.
- The VPS public IP is allowed in Atlas Network Access.
- `MONGODB_DB_NAME` is correct.
- The service was restarted after changing `.env`.

```bash
systemctl restart dwarika
curl http://127.0.0.1:3000/api/health
```

### Admin API calls use the wrong URL

Check `.env.admin`:

```env
VITE_API_URL=https://your-store.com
VITE_STOREFRONT_URL=https://your-store.com
```

Then rebuild:

```bash
su -s /bin/bash dwarika
cd /var/www/dwarika
npm run build:admin
exit
systemctl restart dwarika
```

### Admin refresh returns 404

Confirm that the request uses the admin hostname:

```bash
curl -H "Host: admin.your-store.com" http://127.0.0.1:3000/login
```

Also verify that `dist-admin/index.html` exists.

### Changes are not visible

Rebuild and restart:

```bash
su -s /bin/bash dwarika
cd /var/www/dwarika
npm run build:all
exit
systemctl restart dwarika
```

Clear the browser cache or use a private window.
