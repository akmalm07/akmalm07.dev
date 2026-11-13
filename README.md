# Akmal's portfolio

A React and Node.js portfolio with project updates, a journal, a Google Calendar embed, and a content editor. Requires Node.js 20.19+ (20.x) or 22.12+.

## Run locally

Run `npm ci`, `npm run build`, and `npm start`, then visit http://localhost:5050. The admin is at http://localhost:5050/admin. The first startup creates `.admin-password` unless `ADMIN_PASSWORD` is configured. Copy `.env.example` to `.env` to configure optional contact email; all three Gmail variables are required to enable the form.

## Content and images

The admin manages the profile image, featured projects, updates, journal posts, and Google Calendar ID. Journal controls insert formatting and images at the cursor. Images must be PNG, JPEG, WebP, or GIF, at most 5 MB.

Content lives in `data/content.json` and uploaded images in `data/uploads/` by default. Both are excluded from Git. Set `DATA_DIR` to a persistent directory to store them elsewhere. Back up the entire data directory, including uploads. The GitHub repository does not include current content, calendar ID, uploaded images, passwords, or `.env`; transfer the data directory separately over a secure connection if you want the VPS to show your current content. Uploaded images and published content are publicly accessible.

To connect Google Calendar, select a calendar in Google Calendar settings, make it public under Access permissions, copy its Calendar ID under Integrate calendar, and save it under Calendar in the site admin. Use a separate public calendar or free/busy-only sharing if you do not want to reveal event details.

The GitHub section shows up to six recently pushed public repositories from `akmalm07`, excluding forks and archived repositories. If GitHub is unavailable or its rate limit is reached, visitors can still use the profile link.

## Deploy to an Ubuntu or Debian VPS

This reference deployment uses systemd, Nginx, and HTTPS. It has not been deployed to a server by this repository. You need a domain pointed at the VPS, a firewall permitting ports 80 and 443, a supported Node.js version installed at `/usr/bin/node`, Git access to the repository, Nginx, Certbot's Nginx plugin, and `apache2-utils` for `htpasswd`.

1. Clone the repository to `/var/www/akmalm07.dev` and install dependencies:

   ```sh
   sudo mkdir -p /var/www
   sudo git clone <YOUR_REPOSITORY_CLONE_URL> /var/www/akmalm07.dev
   cd /var/www/akmalm07.dev
   sudo npm ci
   sudo npm run build
   sudo npm prune --omit=dev
   ```

   For a private repository, configure GitHub SSH access for the account doing the clone, or use an authenticated deployment method. Do not put access tokens into clone URLs or committed files.

2. Create a dedicated service account and persistent data directory. To transfer current content, securely copy the contents of your local `data/` into `/var/lib/akmalm07.dev/` before starting the service. Otherwise, the server starts with empty content.

   ```sh
   sudo useradd --system --no-create-home --shell /usr/sbin/nologin akmal-site
   sudo install -d -o akmal-site -g akmal-site -m 750 /var/lib/akmalm07.dev
   sudo chown -R akmal-site:akmal-site /var/lib/akmalm07.dev
   ```

3. Copy `.env.example` to `.env`, set a long unique `ADMIN_PASSWORD`, and optionally configure email. The service uses `/var/lib/akmalm07.dev` for `DATA_DIR`. Keep `.env` private, then install the service:

   ```sh
   sudo cp .env.example .env
   sudo nano .env
   sudo chmod 600 .env
   sudo cp deploy/akmalm07.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now akmalm07
   sudo systemctl status akmalm07
   ```

4. Create a separate Nginx password for the admin routes, copy `deploy/nginx.conf` to `/etc/nginx/sites-available/akmalm07`, and replace `example.com` with your domain. The example requires HTTP Basic Authentication on `/admin` and `/api/admin/`, in addition to the app password. Enable and validate the site:

   ```sh
   sudo htpasswd -c /etc/nginx/akmalm07.htpasswd YOUR_ADMIN_USERNAME
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/akmalm07
   sudo nano /etc/nginx/sites-available/akmalm07
   sudo ln -s /etc/nginx/sites-available/akmalm07 /etc/nginx/sites-enabled/akmalm07
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. Enable HTTPS with `sudo certbot --nginx -d example.com` and check renewal with `sudo certbot renew --dry-run`. Confirm HTTP redirects to HTTPS and the admin paths still require Nginx authentication. Do not sign in over HTTP. The Node process listens only on `127.0.0.1:5050`; do not expose that port to the internet. Nginx must pass the original `Host` and `X-Forwarded-Proto` headers as shown in the example.

6. Open the HTTPS site, verify the calendar and images, and sign in to `/admin` through both password prompts. The contact form requires the optional email configuration. Google Calendar must be public or shared with each viewer; the GitHub section depends on GitHub's public API.

For updates, back up `/var/lib/akmalm07.dev` and `.env`, pull the new code, run `npm ci`, `npm run build`, and `npm prune --omit=dev`, then restart with `sudo systemctl restart akmalm07`. The separate data directory survives code updates. Check logs with `sudo journalctl -u akmalm07 -e`.
