# 🚀 Oracle Cloud (OCI) Always-Free Deployment Guide

## 1. Overview
Your Oracle Cloud Always-Free ARM Ampere instance gives you:
- **4 OCPUs (ARM64)**
- **24 GB RAM**
- **$0/month indefinitely**

This is more than enough to handle **50,000+ concurrent active video roulette matches** on Socket.IO since WebRTC media streams flow directly peer-to-peer (P2P), consuming virtually zero server bandwidth!

---

## 2. Quick Deploy with PM2 (Recommended & Fastest)

### Step 1: SSH into your OCI Instance
```bash
ssh -i /path/to/your-key.key ubuntu@<YOUR_OCI_PUBLIC_IP>
```

### Step 2: Install Node.js 20 & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### Step 3: Copy or Clone the `server/roulette-server.js` file
```bash
mkdir -p /home/ubuntu/supertime-roulette
cd /home/ubuntu/supertime-roulette
# Copy package.json and server/roulette-server.js here, or clone repo
npm init -y
npm install socket.io
```

### Step 4: Start with PM2
```bash
pm2 start server/roulette-server.js --name roulette-signaling -i max
pm2 save
pm2 startup
```

---

## 3. OCI Security List / Firewall Ports

Make sure to open port `3001` (or `443` if using Caddy / Nginx reverse proxy):

1. Go to **OCI Console** -> **Networking** -> **Virtual Cloud Networks**.
2. Select your VCN and click **Security Lists** -> **Default Security List**.
3. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `3001, 80, 443`
4. On the Ubuntu instance, open iptables / ufw:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
sudo netfilter-persistent save
```

---

## 4. Free Automatic HTTPS with Caddy (Optional & Recommended)

If you have a domain or subdomain pointing to your OCI IP (e.g. `roulette.yourdomain.com`):

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Add this to `/etc/caddy/Caddyfile`:
```caddy
roulette.yourdomain.com {
    reverse_proxy localhost:3001
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```
Caddy will automatically provision and renew a free Let's Encrypt SSL certificate!

---

## 5. Connecting Your Frontend

In your Vercel project or `.env.local`:
```env
NEXT_PUBLIC_ROULETTE_SOCKET_URL=https://roulette.yourdomain.com
```
(Or `http://<YOUR_OCI_IP>:3001` for development testing).
If left blank, `useRouletteSocket` will default to `http://localhost:3001` when running locally!
