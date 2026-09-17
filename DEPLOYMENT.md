# Netra AI — Production Deployment Guide

This guide provides end-to-end instructions for deploying **Netra AI** to production across different hosting environments.

---

## 🏛️ Deployment Architecture Options

### Option 1: Unified Fullstack Service (Recommended)
In this mode, the Python FastAPI backend serves:
1. All REST API endpoints (`/api/...`)
2. Health check endpoints (`/health`)
3. Static uploads and fundus scans (`/uploads/...`, `/sample_images/...`)
4. The pre-compiled React + Vite single-page application (`frontend/dist`)

**Advantages:**
- Single container / single web service.
- **Zero CORS configuration required** (API and frontend share the exact same domain & port).
- Minimal infrastructure cost (can run on free/low-cost tiers like Render Free, Railway, or a $5 VPS).

---

## 🐳 Quickest Deployment: Docker & Docker Compose

Netra AI includes a multi-stage `Dockerfile` and `docker-compose.yml` with persistent volume management for user records and uploaded retinal scans.

### 1. Run with Docker Compose
```bash
# Clone the repository on your server
git clone <repo-url>
cd "sih project"

# Build and start the container in detached mode
docker compose up -d --build
```

### 2. Verify Container Health
```bash
# Check status and healthcheck
docker ps

# Check unified logs
docker compose logs -f
```

The application is immediately available at `http://<your-server-ip>:8000`.

---

## ☁️ Cloud Platform Deployments

### A. Deploy on Render (1-Click Blueprint)

1. Push your code to GitHub / GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** ➜ **Blueprint**.
4. Connect your repository. Render will automatically detect `render.yaml`.
5. Render will provision:
   - A Docker web service with health check at `/health`.
   - A 1GB persistent disk for `database/netra_store.json`.
6. Click **Apply**. Once built, your app will be live at `https://netra-ai.onrender.com`.

### B. Deploy on Railway

1. Install Railway CLI or connect via [Railway.app](https://railway.app/).
2. Create a new project ➜ **Deploy from GitHub repo**.
3. Railway automatically detects the multi-stage `Dockerfile`.
4. In **Settings ➜ Networking**, click **Generate Domain**.
5. In **Variables**, add:
   - `ENVIRONMENT=production`
   - `SECRET_KEY=<your-generated-random-secret>`
   - `ALLOWED_ORIGINS=*`
6. Add a persistent volume mounted at `/app/database` for data persistence.

### C. Deploy on Vercel (Frontend) + Render/Railway (Backend) — Decoupled

If you prefer deploying the React frontend on **Vercel** and the backend on **Render**:

1. **Deploy Backend first** on Render/Railway using the Dockerfile or:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend
   ```
2. Note your backend URL (e.g., `https://netra-api.onrender.com`).
3. **Deploy Frontend on Vercel**:
   - Set Root Directory to `frontend`.
   - Framework Preset: **Vite**.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Add Environment Variable:
     - `VITE_API_BASE_URL` = `https://netra-api.onrender.com`
4. In your Backend configuration, set:
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app`

---

## 🖥️ Traditional Linux VPS (Ubuntu 22.04 / 24.04 LTS)

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx
```

### 2. Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Setup Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 4. Create systemd Service
Create `/etc/systemd/system/netra.service`:
```ini
[Unit]
Description=Netra AI Healthcare Platform
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/sih-project
Environment="PATH=/home/ubuntu/sih-project/venv/bin"
Environment="ENVIRONMENT=production"
Environment="PORT=8000"
Environment="HOST=127.0.0.1"
ExecStart=/home/ubuntu/sih-project/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable netra
sudo systemctl start netra
```

### 5. Configure Nginx Reverse Proxy & SSL
Create `/etc/nginx/sites-available/netra`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and acquire Let's Encrypt SSL:
```bash
sudo ln -s /etc/nginx/sites-available/netra /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔍 Health Checks & Operational Verification

### Verify Health Endpoint
```bash
curl -i https://yourdomain.com/health
```
Expected output:
```json
{
  "status": "healthy",
  "platform": "Netra AI",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "status": "connected",
    "users_count": 3,
    "screenings_count": 0,
    "appointments_count": 0
  }
}
```

### Verify SPA Serving
```bash
curl -i https://yourdomain.com/
```
Returns `HTTP/1.1 200 OK` with the React application HTML document.

---

## 🔒 Security & Best Practices Checklist

- [x] **Randomized JWT Secret**: Set `SECRET_KEY` in environment variables before public exposure.
- [x] **File Upload Limits**: FastAPI limits and Nginx `client_max_body_size 50M` protect against payload exhaustion.
- [x] **Persistent Storage**: Ensure `database/netra_store.json` and `uploads/` directories are mapped to persistent cloud disks or Docker volumes so user scans and reports survive redeployments.
- [x] **HTTPS Encryption**: Enforce TLS/SSL certificates (via Let's Encrypt, Cloudflare, or Render/Railway automatic SSL).
