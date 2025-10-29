# Subdomain Setup Guide

## Overview

Your SaaS SMS Calendar application uses subdomain-based multi-tenancy. Each organization gets its own subdomain:
- Example: `acme-corp.yourdomain.com`
- Example: `hudson-river.yourdomain.com`

This guide explains how to set up subdomains for both development and production environments.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Production Setup](#production-setup)
3. [SSL Certificates](#ssl-certificates)
4. [Testing Subdomains](#testing-subdomains)
5. [Troubleshooting](#troubleshooting)

---

## Development Setup

### Option 1: Using localhost with ports (Simplest)

For local development without subdomain routing:

**Configuration:**
```env
# client/.env
VITE_API_URL=http://localhost:4000

# api/.env
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000
```

**Access:**
- Client: `http://localhost:3001`
- API: `http://localhost:4000`

**Note:** Subdomains won't work locally, but JWT tokens with `orgId` will still isolate data correctly.

---

### Option 2: Using lvh.me (Recommended for testing subdomains)

`lvh.me` is a free service that points all subdomains to `127.0.0.1` (localhost).

**Configuration:**
```env
# client/.env
VITE_API_URL=http://lvh.me:4000

# api/.env
NODE_ENV=development
PORT=4000
API_URL=http://lvh.me:4000
BASE_DOMAIN=lvh.me:3001
```

**Access:**
- Main app: `http://lvh.me:3001`
- Organization subdomain: `http://acme-corp.lvh.me:3001`
- API: `http://lvh.me:4000`

**Advantages:**
- No configuration needed
- Works immediately
- Real subdomain routing
- No hosts file editing

---

### Option 3: Using /etc/hosts file (Full control)

Edit your hosts file to map subdomains to localhost.

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**macOS/Linux:** `/etc/hosts`

```hosts
127.0.0.1   localhost
127.0.0.1   myapp.local
127.0.0.1   org1.myapp.local
127.0.0.1   org2.myapp.local
127.0.0.1   acme.myapp.local
```

**Configuration:**
```env
# client/.env
VITE_API_URL=http://myapp.local:4000

# api/.env
NODE_ENV=development
PORT=4000
API_URL=http://myapp.local:4000
BASE_DOMAIN=myapp.local:3001
```

**Access:**
- Main app: `http://myapp.local:3001`
- Organization subdomain: `http://acme.myapp.local:3001`

**Note:** You need to manually add each subdomain to the hosts file.

---

### Option 4: Using nip.io (Works on any device)

`nip.io` provides wildcard DNS for any IP address.

**Configuration:**
```env
# client/.env
VITE_API_URL=http://127.0.0.1.nip.io:4000

# api/.env
NODE_ENV=development
PORT=4000
API_URL=http://127.0.0.1.nip.io:4000
BASE_DOMAIN=127.0.0.1.nip.io:3001
```

**Access:**
- Main app: `http://127.0.0.1.nip.io:3001`
- Organization subdomain: `http://acme.127.0.0.1.nip.io:3001`

**Advantages:**
- Works across devices on your network
- Use your local IP (e.g., `192.168.1.100.nip.io`)
- Great for mobile testing

---

## Production Setup

### 1. Domain Setup

**Purchase a domain** (e.g., `yourdomain.com` from Namecheap, GoDaddy, etc.)

**Add DNS records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_SERVER_IP` | 3600 |
| A | * | `YOUR_SERVER_IP` | 3600 |
| CNAME | www | `yourdomain.com` | 3600 |

The wildcard `*` A record enables all subdomains to point to your server.

---

### 2. SSL Certificate (Let's Encrypt)

**Install Certbot:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**Get wildcard SSL certificate:**
```bash
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  -d yourdomain.com \
  -d *.yourdomain.com \
  --agree-tos \
  --email your-email@example.com
```

**Follow the prompts** to add TXT records to your DNS:
1. Certbot will give you a TXT record
2. Add it to your DNS provider:
   - Type: `TXT`
   - Name: `_acme-challenge`
   - Value: `[provided by certbot]`
3. Wait 1-2 minutes for DNS propagation
4. Press Enter in Certbot

**Auto-renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab (runs twice daily)
sudo crontab -e
```

Add this line:
```
0 */12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

### 3. Nginx Configuration

**Copy the provided `nginx.conf` to your server:**

```bash
# Upload the nginx.conf file
scp nginx.conf user@yourserver:/tmp/

# On server, backup existing config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Copy new config (or include it)
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/saas-sms-calendar

# Create symlink
sudo ln -s /etc/nginx/sites-available/saas-sms-calendar /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

**Update paths in nginx.conf:**
- Replace `yourdomain.com` with your actual domain
- Update SSL certificate paths
- Update upstream server ports if different
- Update root directories for static files

---

### 4. Deploy Application

**Build the client:**
```bash
cd client
npm run build
```

**Deploy files:**
```bash
# Copy built files to server
scp -r dist/* user@yourserver:/var/www/yourdomain.com/client/
```

**Start API server (using PM2):**
```bash
# On server
cd /path/to/api
npm install --production

# Install PM2
npm install -g pm2

# Start API
pm2 start src/server.js --name saas-sms-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

### 5. Environment Variables (Production)

**API (.env):**
```env
NODE_ENV=production
PORT=4000
API_URL=https://yourdomain.com
BASE_DOMAIN=yourdomain.com

# MongoDB
MONGODB_URI=your_production_mongodb_uri

# JWT
JWT_SECRET=your-production-secret-very-long-and-random
JWT_REFRESH_SECRET=your-refresh-secret-very-long-and-random

# Twilio (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# Email (optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com

# Redis (recommended for production)
REDIS_URL=redis://localhost:6379
```

**Client (.env.production):**
```env
VITE_API_URL=https://yourdomain.com
```

---

## Testing Subdomains

### Test Subdomain Creation

1. **Register a new organization** at `http://localhost:3001/register` (dev) or `https://yourdomain.com/register` (prod)

2. **Choose a subdomain** (e.g., "acme-corp")

3. **Complete registration**

4. **Access your subdomain:**
   - Dev: `http://acme-corp.lvh.me:3001`
   - Prod: `https://acme-corp.yourdomain.com`

### Verify Isolation

1. Register multiple organizations with different subdomains
2. Login to each subdomain
3. Verify that data doesn't leak between organizations
4. Check browser DevTools → Network → Headers:
   - JWT token should contain `orgId`
   - API responses should only return data for that organization

---

## Troubleshooting

### Subdomains not working locally

**Problem:** `acme.lvh.me:3001` doesn't load

**Solutions:**
1. Check that both API and client servers are running
2. Verify `BASE_DOMAIN` is set in API `.env`
3. Try `lvh.me` instead of `localhost`
4. Clear browser cache and cookies

---

### SSL certificate issues in production

**Problem:** "Your connection is not private" error

**Solutions:**
1. Verify wildcard certificate covers `*.yourdomain.com`:
   ```bash
   sudo certbot certificates
   ```
2. Check certificate paths in nginx config
3. Ensure DNS propagation is complete:
   ```bash
   dig yourdomain.com
   dig acme.yourdomain.com
   ```
4. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

---

### Subdomain shows 404 in production

**Problem:** Subdomain loads but shows 404 error

**Solutions:**
1. Check nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```
2. Verify wildcard DNS record exists
3. Ensure nginx wildcard server block is configured
4. Test nginx configuration:
   ```bash
   sudo nginx -t
   ```

---

### API requests failing from subdomain

**Problem:** CORS errors or API not reachable

**Solutions:**
1. Check nginx proxy configuration
2. Verify API server is running:
   ```bash
   pm2 status
   ```
3. Check API logs:
   ```bash
   pm2 logs saas-sms-api
   ```
4. Test API health endpoint:
   ```bash
   curl https://acme.yourdomain.com/health
   ```

---

### Subdomain validation not working

**Problem:** Frontend shows subdomain as "taken" when it's not

**Solutions:**
1. Check API logs for errors
2. Verify database connection
3. Test API endpoint directly:
   ```bash
   curl "http://localhost:4000/api/v1/auth/check-subdomain?subdomain=test"
   ```
4. Clear browser console and retry

---

## Security Considerations

1. **Wildcard SSL Certificate:**
   - Covers all subdomains
   - Must be renewed every 90 days (auto-renewal recommended)

2. **Subdomain Validation:**
   - Only lowercase letters, numbers, and hyphens allowed
   - Minimum 2 characters
   - Maximum 63 characters
   - Cannot start or end with hyphen

3. **Reserved Subdomains:**
   Consider blocking reserved subdomains like:
   - `www`, `api`, `admin`, `mail`, `ftp`
   - `smtp`, `pop`, `imap`, `webmail`
   - `staging`, `dev`, `test`, `demo`

Add validation in `authService.js`:
```javascript
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'mail', 'ftp'];

if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
  throw new ConflictError('This subdomain is reserved');
}
```

---

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Subdomain Configuration](https://nginx.org/en/docs/http/server_names.html)
- [lvh.me Service](http://lvh.me/)
- [nip.io Service](https://nip.io/)

---

## Support

If you encounter any issues:
1. Check the logs (API and nginx)
2. Verify DNS configuration
3. Test with curl/Postman
4. Review this guide carefully

Happy subdomain routing! 🚀
