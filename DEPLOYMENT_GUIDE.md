# Manual Upload Web App - Deployment Guide

## 📋 Table of Contents
1. [Backend Deployment](#backend-deployment)
2. [Frontend Deployment](#frontend-deployment)
3. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
4. [Free Hosting Services](#free-hosting-services)

---

## Backend Deployment

### Option 1: Deploy on Render.com (Recommended)

**Step 1: Prepare Your Repository**

1. Initialize a Git repository in your backend folder:
```bash
cd /path/to/backend
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub (or GitLab/Gitea)

3. Push your code:
```bash
git remote add origin https://github.com/yourusername/manual-upload-backend.git
git push -u origin main
```

**Step 2: Deploy on Render**

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Fill in the configuration:
   - **Name**: `manual-upload-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (auto-sleep after 15 min inactivity)

6. Add Environment Variables:
   - Click "Environment"
   - Add these variables:
     ```
     PORT=5000
     JWT_SECRET=your-secure-secret-key-here
     JWT_EXPIRES=1d
     NODE_ENV=production
     ```

7. Click "Create Web Service"

**Your backend will be live at**: `https://manual-upload-api.onrender.com`

---

### Option 2: Deploy on Railway.app

**Step 1: Connect Repository**

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Find and select your backend repository

**Step 2: Configure**

1. In Railway dashboard, click "Variables"
2. Add environment variables:
   ```
   PORT=5000
   JWT_SECRET=your-secure-secret-key-here
   JWT_EXPIRES=1d
   NODE_ENV=production
   ```

3. Railway automatically detects `package.json` and starts your app

4. Under "Settings" → "Domains", get your public URL

**Your backend will be live at**: `https://your-project-name.railway.app`

---

### Option 3: Deploy on Fly.io

**Step 1: Install CLI**

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

**Step 2: Create Fly App**

```bash
cd /path/to/backend
fly launch
```

When prompted:
- App name: `manual-upload-api`
- Choose region closest to you
- Do not modify `Dockerfile`

**Step 3: Set Environment Variables**

```bash
fly secrets set JWT_SECRET="your-secure-secret-key-here"
fly secrets set JWT_EXPIRES="1d"
fly secrets set NODE_ENV="production"
```

**Step 4: Deploy**

```bash
fly deploy
```

**Your backend will be live at**: `https://manual-upload-api.fly.dev`

---

## Frontend Deployment

### Option 1: Deploy on Netlify (Recommended)

**Step 1: Prepare Files**

Ensure your frontend folder has:
- `index.html`
- `login.html`
- `register.html`
- `admin.html`
- `style.css`
- `script.js`

Create a file `netlify.toml` in the frontend folder:

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2: Push to GitHub**

```bash
cd /path/to/frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/manual-upload-frontend.git
git push -u origin main
```

**Step 3: Deploy on Netlify**

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your frontend repository
5. Configure build:
   - **Base directory**: Leave empty
   - **Build command**: Leave empty (no build needed)
   - **Publish directory**: `.`

6. Click "Deploy site"

**Your frontend will be live at**: `https://your-site-name.netlify.app`

---

### Option 2: Deploy on Vercel

**Step 1: Push to GitHub**

```bash
cd /path/to/frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/manual-upload-frontend.git
git push -u origin main
```

**Step 2: Deploy on Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Select your frontend repository
5. Vercel auto-detects and prepares deployment
6. Click "Deploy"

**Your frontend will be live at**: `https://your-project-name.vercel.app`

---

### Option 3: Deploy on GitHub Pages

**Step 1: Create Repository**

1. Create a new GitHub repository named: `yourusername.github.io`

**Step 2: Push Files**

```bash
cd /path/to/frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/yourusername.github.io.git
git push -u origin main
```

**Step 3: Enable Pages**

1. Go to your repository settings
2. Scroll to "GitHub Pages"
3. Select `main` branch as source
4. Save

**Your frontend will be live at**: `https://yourusername.github.io`

---

## Connecting Frontend to Backend

### Step 1: Update Frontend API URL

After deploying the backend, update your frontend's `script.js`:

Find this line (around line 1):
```javascript
const API_BASE = 'http://localhost:5000/api';
```

Replace with your backend URL:
```javascript
const API_BASE = 'https://manual-upload-api.onrender.com/api'; // or your actual backend URL
```

### Step 2: Update CORS on Backend

If needed, update `server.js` CORS configuration:

```javascript
app.use(cors({
  origin: ['https://your-frontend-url.netlify.app', 'https://manual-upload-api.onrender.com'],
  credentials: true,
}));
```

### Step 3: Re-deploy Frontend

After updating `script.js`:

**For Netlify/Vercel:**
```bash
git add script.js
git commit -m "Update API URL for production"
git push origin main
```

The deployment will auto-redeploy on push.

---

## Environment Variables Reference

### Backend (.env file)

```env
PORT=5000
JWT_SECRET=your-very-secure-secret-key-change-this
JWT_EXPIRES=1d
NODE_ENV=production
```

**Security Tips:**
- Use a strong JWT_SECRET (at least 32 characters)
- Use different secrets for development and production
- Never commit `.env` to git
- Use the deployment platform's secrets manager

### Frontend (No .env needed)

Update the API URL in `script.js` directly, or create a `config.js`:

```javascript
// config.js
const API_BASE = 'https://your-backend-url/api';
```

Then in `script.js`:
```javascript
const API_BASE = 'https://your-backend-url/api';
```

---

## Testing After Deployment

### 1. Test Backend API

```bash
# Test register endpoint
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Should return: {"success":true,"message":"User registered successfully"}
```

### 2. Test Frontend

1. Open `https://your-frontend.netlify.app`
2. Register a new account
3. Login
4. Upload a file
5. Check storage bar displays correctly
6. Test upgrade button (free tier only)

### 3. Check Admin Panel

1. Create two users (one admin, one regular)
2. Go to `https://your-frontend.netlify.app/admin.html` with admin user
3. Verify you can see users, files, and stats

---

## Troubleshooting

### Backend Issues

**"Internal server error" on upload:**
- Check backend logs on deployment platform
- Verify `uploads` folder exists
- Ensure file permissions are correct

**"CORS error" in console:**
- Update CORS settings in backend
- Check frontend URL is added to allowed origins
- Verify API URL in frontend matches backend

**"File not found" on download:**
- Check that file exists in `uploads` folder
- Verify file path is correct in metadata
- Check file permissions

### Frontend Issues

**"Cannot connect to API":**
- Verify API_BASE URL in script.js
- Check backend is running
- Ensure backend URL is accessible from frontend domain
- Check browser console for detailed error

**"Storage bar not showing":**
- Reload the page
- Check browser console for errors
- Verify `/api/user/me` endpoint returns data

**"Upgrade button not working":**
- Check backend is running and `/api/user/upgrade` is accessible
- Verify user is authenticated
- Check browser console for response errors

---

## Performance Optimization

### Backend

1. **Database Optimization**: Current JSON file storage is fine for <1000 users. For scaling:
   - Consider SQLite or PostgreSQL
   - Add indexing on frequently queried fields

2. **File Storage**: Current local storage works for deployment. For scaling:
   - Use AWS S3, Azure Blob, or similar
   - Implement file cleanup policy

### Frontend

1. **Caching**: Add cache headers to static files via deployment platform
2. **Compression**: Enable gzip compression (usually automatic)
3. **Lazy Loading**: Load admin panel only when needed

---

## Monitoring

### Backend Health

Set up monitoring on your deployment platform:
- **Render**: Built-in logs and metrics
- **Railway**: Real-time monitoring dashboard
- **Fly.io**: `fly logs` command

Check logs regularly:
```bash
# Railway
railway logs

# Fly.io
fly logs

# Render: Use web dashboard
```

### Frontend Performance

Use your deployment platform's analytics:
- **Netlify Analytics**: Deployment dashboard
- **Vercel Analytics**: Pro plan feature
- **GitHub Pages**: No built-in analytics

---

## Security Best Practices

1. **JWT Secret**: Use cryptographically secure random string
   ```bash
   # Generate secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS**: All platforms provide HTTPS by default ✓

3. **Rate Limiting**: Add rate limiter to backend (optional)
   ```bash
   npm install express-rate-limit
   ```

4. **File Upload Limits**: Currently 10MB, adjust as needed in `uploadMiddleware.js`

5. **Database Backup**: For production, backup your JSON files regularly

---

## Support

For platform-specific help:
- **Render**: https://render.com/docs
- **Railway**: https://docs.railway.app
- **Fly.io**: https://fly.io/docs
- **Netlify**: https://docs.netlify.com
- **Vercel**: https://vercel.com/docs

---

## Next Steps

Once deployed, you can:

1. **Add Custom Domain**
   - Render, Netlify, Vercel support custom domains
   - Update DNS records with provider

2. **Set Up Email Notifications**
   - Add Sendgrid or similar
   - Send welcome emails on registration

3. **Add Payment Processing**
   - Integrate Stripe for premium upgrades
   - Update `/api/user/upgrade` to charge users

4. **Scale Database**
   - Migrate from JSON to PostgreSQL
   - Add caching layer with Redis

5. **Monitor and Optimize**
   - Track usage metrics
   - Optimize based on user behavior
   - Add more features based on feedback

---

**Last Updated**: June 2026
**Version**: 1.0 (SaaS Ready)
