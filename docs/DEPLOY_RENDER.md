<div align="center">

# ☁️ Deploy on Render — Complete Guide

### *Step-by-Step Deployment for Backend, Database, Frontend & Mobile App*

<br/>

![Render](https://img.shields.io/badge/Render-Cloud-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.10-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54.0.32-000020?style=for-the-badge&logo=expo&logoColor=white)

<br/>

</div>

---

## 📋 Table of Contents

| # | Section | Description |
|:-:|:--------|:------------|
| 1 | [What Gets Deployed](#-1-what-gets-deployed) | Overview of all services |
| 2 | [Prerequisites](#-2-prerequisites) | What you need before starting |
| 3 | [Step 1 — Push to GitHub](#-3-step-1--push-to-github) | Prepare your repository |
| 4 | [Step 2 — Create Render Account](#-4-step-2--create-render-account) | Sign up on Render |
| 5 | [Step 3 — Deploy via Blueprint](#-5-step-3--deploy-via-blueprint) | One-click blueprint deploy |
| 6 | [Step 4 — Database Setup](#-6-step-4--database-setup-society-db) | PostgreSQL configuration |
| 7 | [Step 5 — Backend Setup](#-7-step-5--backend-setup-society-backend) | Spring Boot service config |
| 8 | [Step 6 — Frontend Setup](#-8-step-6--frontend-setup-society-admin-web) | Vite static site config |
| 9 | [Step 7 — Verify Deployment](#-9-step-7--verify-deployment) | Health checks & testing |
| 10 | [Mobile App Deployment](#-10-mobile-app-deployment) | Build & distribute the mobile app |
| 11 | [How Users Access the App](#-11-how-users-access-the-app) | Access guide for all platforms |
| 12 | [Troubleshooting](#-12-troubleshooting) | Common issues & fixes |
| 13 | [Architecture Diagram](#-13-architecture-diagram) | Deployed infrastructure overview |

<br/>

---

## 📦 1. What Gets Deployed

The `render.yaml` blueprint auto-creates **3 services** on Render:

```
╔══════════════════════════════════════════════════════════════════════╗
║                    RENDER DEPLOYMENT OVERVIEW                       ║
╚══════════════════════════════════════════════════════════════════════╝

  ┌──────────────────────────┐
  │  🟢 society-backend       │  ← Spring Boot Java Web Service
  │  Type: Web Service       │     Port: auto-assigned ($PORT)
  │  Plan: Free              │     Health: /actuator/health
  │  Root: /backend          │     Build: Maven → JAR
  └──────────────────────────┘

  ┌──────────────────────────┐
  │  🟢 society-admin-web     │  ← Vite React Static Site
  │  Type: Static Site       │     SPA rewrite: /* → /index.html
  │  Plan: Free              │     Build: npm ci → npm run build
  │  Root: /admin-web        │     Publish: dist/
  └──────────────────────────┘

  ┌──────────────────────────┐
  │  🟢 society-db            │  ← PostgreSQL Managed Database
  │  Type: PostgreSQL        │     Database: society_db
  │  Plan: Free              │     User: society_user
  │  Auto-provisioned        │     Auto-connected to backend
  └──────────────────────────┘
```

> **📱 Mobile App** is NOT deployed on Render — it's built separately via Expo and distributed as APK/IPA or through app stores. See [Section 10](#-10-mobile-app-deployment).

<br/>

---

## 🔧 2. Prerequisites

| Requirement | Details |
|:------------|:--------|
| **GitHub Account** | Repository must be pushed to GitHub (public or private) |
| **Render Account** | Free account at [render.com](https://render.com) |
| **Gmail App Password** | Required for email features (password reset, reminders) |
| **Razorpay Account** | Required for payment features — get keys from [Razorpay Dashboard](https://dashboard.razorpay.com/) |
| **Expo Account** | Required for mobile app builds — [expo.dev](https://expo.dev) |

### 🔑 How to Generate Gmail App Password

> You need this for the backend email service (password resets, reminders, etc.)

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select **App:** `Mail` → **Device:** `Other` → Type `Society Management`
5. Click **Generate** — copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)
6. Use this as `MAIL_PASSWORD` (remove spaces)

### 🔑 How to Get Razorpay Keys

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Click **Generate Key** (use **Test Mode** for development)
4. Copy **Key ID** (starts with `rzp_test_...`) → use as `RAZORPAY_KEY_ID`
5. Copy **Key Secret** → use as `RAZORPAY_KEY_SECRET`

<br/>

---

## 📤 3. Step 1 — Push to GitHub

```bash
# Initialize git if not already
git init
git add .
git commit -m "feat: initial commit - society management system"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/society-management-system.git
git branch -M main
git push -u origin main
```

> ⚠️ Make sure `render.yaml` is in the **root** of the repository. Render reads this file to create all services automatically.

<br/>

---

## 🌐 4. Step 2 — Create Render Account

1. Go to **[render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended — enables auto-deploy)
4. Authorize Render to access your GitHub repositories

<br/>

---

## 🚀 5. Step 3 — Deploy via Blueprint

This is the **easiest method** — Render reads `render.yaml` and auto-creates everything.

### Step-by-Step

| Step | Action | Screenshot Hint |
|:----:|:-------|:----------------|
| **1** | Go to [dashboard.render.com](https://dashboard.render.com/) | — |
| **2** | Click **"New +"** button (top-right) | Blue button |
| **3** | Select **"Blueprint"** from dropdown | — |
| **4** | Connect your **GitHub repository** | Select `society-management-system` |
| **5** | Render auto-detects `render.yaml` | Shows 3 services |
| **6** | Review the services list | Backend + Frontend + Database |
| **7** | Click **"Apply"** | Deployment starts |

### What Render Creates Automatically

```
✅ society-backend    → Java Web Service (Port auto-assigned)
✅ society-admin-web  → Static Site (dist/ folder)
✅ society-db         → PostgreSQL Database (society_db / society_user)
```

### What's Auto-Configured (from render.yaml)

| Variable | Source | Auto-Set? |
|:---------|:-------|:---------:|
| `DB_URL` | From `society-db` connection string | ✅ Auto |
| `DB_USERNAME` | From `society-db` user property | ✅ Auto |
| `DB_PASSWORD` | From `society-db` password property | ✅ Auto |
| `APP_FRONTEND_URL` | From `society-admin-web` URL | ✅ Auto |
| `JWT_COOKIE_SECURE` | Hardcoded `true` in render.yaml | ✅ Auto |
| `SPRING_PROFILES_ACTIVE` | Hardcoded `prod` in render.yaml | ✅ Auto |
| `VITE_API_URL` | From `society-backend` URL | ✅ Auto |

> 🎯 The above variables are **automatically wired** — you do NOT need to set them manually.

<br/>

---

## 🗄️ 6. Step 4 — Database Setup (`society-db`)

### What Render Creates

| Field | Value |
|:------|:------|
| **Service Name** | `society-db` |
| **Database Name** | `society_db` |
| **User** | `society_user` |
| **Plan** | Free (30-day limit, 256 MB storage) |
| **Region** | Auto-selected (choose closest to your users) |
| **PostgreSQL Version** | Latest available (18+) |

### ℹ️ Free Plan Limitations

```
╔══════════════════════════════════════════════════════╗
║  ⚠️ RENDER FREE POSTGRESQL LIMITATIONS               ║
╠══════════════════════════════════════════════════════╣
║  • Storage: 256 MB max                              ║
║  • Expiry: Deleted after 30 days of inactivity      ║
║  • Connections: Limited concurrent connections       ║
║  • Backups: Manual only (no auto-backups)           ║
║  • Performance: Shared CPU, not for production      ║
╚══════════════════════════════════════════════════════╝
```

### 🔍 Verify Database Connection

After deployment, go to your **society-db** service in Render Dashboard:

1. Click on `society-db` in services list
2. Go to **"Info"** tab
3. You'll see:

| Property | Example Value | Description |
|:---------|:-------------|:------------|
| **Internal Database URL** | `postgres://society_user:xxxx@dpg-xxxx:5432/society_db` | Used by backend (auto-wired) |
| **External Database URL** | `postgres://society_user:xxxx@dpg-xxxx.oregon-postgres.render.com:5432/society_db` | For connecting from local tools |
| **PSQL Command** | `PGPASSWORD=xxxx psql -h dpg-xxxx.oregon-postgres.render.com -U society_user society_db` | Direct terminal access |

### 📝 Optional: Load Schema Manually

If the backend's `spring.jpa.hibernate.ddl-auto=update` doesn't create all tables automatically, you can load the schema manually:

```bash
# Connect using the External Database URL from Render dashboard
psql "postgres://society_user:YOUR_PASSWORD@dpg-xxxx.oregon-postgres.render.com:5432/society_db"

# Then paste contents of database/schema.sql
# OR use the PSQL command from Render's "Info" tab
```

> 💡 **In most cases, Hibernate auto-creates tables** on first startup — manual schema loading is rarely needed.

<br/>

---

## ⚙️ 7. Step 5 — Backend Setup (`society-backend`)

### Auto-Configured Values (DO NOT CHANGE)

These are set by `render.yaml` and wired automatically:

| Variable | Value / Source | Notes |
|:---------|:--------------|:------|
| `DB_URL` | ← `society-db` connection string | ✅ Auto-wired from database |
| `DB_USERNAME` | ← `society-db` user | ✅ Auto-wired |
| `DB_PASSWORD` | ← `society-db` password | ✅ Auto-wired |
| `APP_FRONTEND_URL` | ← `society-admin-web` URL | ✅ Auto-wired (e.g., `https://society-admin-web.onrender.com`) |
| `JWT_COOKIE_SECURE` | `true` | ✅ Hardcoded for HTTPS |
| `SPRING_PROFILES_ACTIVE` | `prod` | ✅ Hardcoded |

### 🔧 Manual Environment Variables (YOU MUST SET THESE)

Go to **Render Dashboard** → **society-backend** → **Environment** tab → Click **"Add Environment Variable"**

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              🔧 REQUIRED ENVIRONMENT VARIABLES — BACKEND                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Fill each variable below in the Render Environment Variables form:        ║
║                                                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### 1️⃣ JWT_SECRET (🔴 Required)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `JWT_SECRET` |
| **Value** | A strong random Base64 string (minimum 32 characters) |

**How to generate:**

```bash
# Option 1: Using OpenSSL (Linux/Mac/Git Bash)
openssl rand -base64 64

# Option 2: Using Python
python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(64)).decode())"

# Option 3: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Example value** (generate your own, DON'T use this):
```
dGhpcyBpcyBhIHN1cGVyIHNlY3VyZSBqd3Qgc2VjcmV0IGtleSB0aGF0IHNob3VsZCBiZSByYW5kb21seSBnZW5lcmF0ZWQ=
```

> ⚠️ **IMPORTANT:** Never share or commit your JWT_SECRET. Generate a unique one for production.

---

#### 2️⃣ MAIL_USERNAME (🟡 Required for Email Features)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `MAIL_USERNAME` |
| **Value** | Your Gmail address |

**Example:**
```
your.email@gmail.com
```

> This email address will be used as the **sender** for all system emails (password resets, reminders, notifications).

---

#### 3️⃣ MAIL_PASSWORD (🟡 Required for Email Features)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `MAIL_PASSWORD` |
| **Value** | Gmail App Password (16 characters, no spaces) |

**Example:**
```
abcdefghijklmnop
```

> ⚠️ This is NOT your Gmail login password. This is the **App Password** generated in [Prerequisites](#-how-to-generate-gmail-app-password).

---

#### 4️⃣ APP_ADMIN_EMAIL (🟡 Recommended)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `APP_ADMIN_EMAIL` |
| **Value** | Email for the default Platform Owner account |

**Example:**
```
admin@yoursociety.com
```

> This creates the **first PLATFORM_OWNER** user on startup. You'll use this email to log into the admin panel the first time.

---

#### 5️⃣ RAZORPAY_KEY_ID (🟡 Required for Payments)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `RAZORPAY_KEY_ID` |
| **Value** | Razorpay Key ID from dashboard |

**Example (Test Mode):**
```
rzp_test_1234567890abcdef
```

**Example (Live Mode):**
```
rzp_live_1234567890abcdef
```

---

#### 6️⃣ RAZORPAY_KEY_SECRET (🟡 Required for Payments)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `RAZORPAY_KEY_SECRET` |
| **Value** | Razorpay Key Secret from dashboard |

**Example:**
```
AbCdEfGhIjKlMnOpQrStUvWx
```

---

#### 7️⃣ APP_CORS_ALLOWED_ORIGINS (🟢 Optional)

| Field | Value to Enter |
|:------|:---------------|
| **Key** | `APP_CORS_ALLOWED_ORIGINS` |
| **Value** | Additional allowed frontend origins (comma-separated) |

**Example:**
```
https://your-custom-domain.com,https://www.your-custom-domain.com
```

> Only needed if you have a **custom domain**. The Render frontend URL is auto-allowed.

---

### 📋 Complete Backend Variables Summary

| # | Variable | Example Value | Required | Auto-Set |
|:-:|:---------|:-------------|:--------:|:--------:|
| 1 | `DB_URL` | `postgres://...` (from Render DB) | ✅ | ✅ Auto |
| 2 | `DB_USERNAME` | `society_user` | ✅ | ✅ Auto |
| 3 | `DB_PASSWORD` | `(generated by Render)` | ✅ | ✅ Auto |
| 4 | `APP_FRONTEND_URL` | `https://society-admin-web.onrender.com` | ✅ | ✅ Auto |
| 5 | `JWT_COOKIE_SECURE` | `true` | ✅ | ✅ Auto |
| 6 | `SPRING_PROFILES_ACTIVE` | `prod` | ✅ | ✅ Auto |
| 7 | `JWT_SECRET` | `(your base64 string)` | 🔴 Manual | ❌ |
| 8 | `MAIL_USERNAME` | `your.email@gmail.com` | 🟡 Manual | ❌ |
| 9 | `MAIL_PASSWORD` | `abcdefghijklmnop` | 🟡 Manual | ❌ |
| 10 | `APP_ADMIN_EMAIL` | `admin@yoursociety.com` | 🟡 Manual | ❌ |
| 11 | `RAZORPAY_KEY_ID` | `rzp_test_xxxxx` | 🟡 Manual | ❌ |
| 12 | `RAZORPAY_KEY_SECRET` | `AbCdEfGhIjKl` | 🟡 Manual | ❌ |
| 13 | `APP_CORS_ALLOWED_ORIGINS` | `https://custom-domain.com` | 🟢 Optional | ❌ |

### 🔧 How to Add Variables in Render UI

```
Render Dashboard
  └── society-backend (click on it)
       └── Environment (left sidebar)
            └── Environment Variables section
                 └── Click "Add Environment Variable"
                      ├── Key:   JWT_SECRET
                      └── Value: (paste your generated secret)
                 └── Click "Add Environment Variable"
                      ├── Key:   MAIL_USERNAME
                      └── Value: your.email@gmail.com
                 └── ... (repeat for each variable)
                 └── Click "Save Changes"
```

> After adding variables, click **"Manual Deploy"** → **"Deploy latest commit"** to apply changes.

### ⏱️ Backend Build & Start

| Phase | Command | Duration |
|:------|:--------|:---------|
| **Build** | `chmod +x mvnw ; ./mvnw clean package -DskipTests` | ~3-5 minutes |
| **Start** | `java -Dserver.port=$PORT -jar target/backend-0.0.1-SNAPSHOT.jar` | ~30-60 seconds |
| **Health Check** | `GET /actuator/health` | Checked every 30 seconds |

> 💡 **Free tier:** Backend may sleep after 15 minutes of inactivity. First request after sleep takes ~30-60 seconds to wake up.

<br/>

---

## 🖥️ 8. Step 6 — Frontend Setup (`society-admin-web`)

### Auto-Configured Values

| Variable | Value / Source | Notes |
|:---------|:--------------|:------|
| `VITE_API_URL` | ← `society-backend` URL | ✅ Auto-wired (e.g., `https://society-backend.onrender.com`) |

### 🎯 No Manual Variables Needed!

The frontend requires only `VITE_API_URL` which is **auto-wired** from the backend service URL via `render.yaml`.

### What Render Configures

| Setting | Value | Description |
|:--------|:------|:------------|
| **Build Command** | `npm ci ; npm run build` | Installs deps & builds production bundle |
| **Publish Directory** | `dist` | Vite outputs built files here |
| **Root Directory** | `admin-web` | Points to the frontend folder |
| **SPA Rewrite** | `/* → /index.html` | All routes handled by React Router |

### ⏱️ Frontend Build

| Phase | Command | Duration |
|:------|:--------|:---------|
| **Install** | `npm ci` | ~1-2 minutes |
| **Build** | `npm run build` | ~30-60 seconds |
| **Deploy** | Serve `dist/` as static files | Instant |

### 🌐 Frontend URL

After deployment, your frontend is available at:

```
https://society-admin-web.onrender.com
```

> If you have a custom domain, add it in **Render Dashboard → society-admin-web → Settings → Custom Domains**.

<br/>

---

## ✅ 9. Step 7 — Verify Deployment

### 🔍 Health Checks

| Check | URL | Expected Response |
|:------|:----|:-----------------|
| **Backend Health** | `https://society-backend.onrender.com/actuator/health` | `{"status":"UP"}` |
| **Frontend** | `https://society-admin-web.onrender.com` | Welcome/Login page loads |
| **Database** | Check via backend health endpoint | Included in health status |

### 🔐 First Login

After successful deployment:

1. Open `https://society-admin-web.onrender.com`
2. Click **"Login"**
3. Use the **Platform Owner** credentials:

| Field | Value |
|:------|:------|
| **Email** | The email you set in `APP_ADMIN_EMAIL` |
| **Password** | Set during first boot by `DataInitializer` (check backend logs) |

> 💡 **Tip:** Check backend logs in Render Dashboard → `society-backend` → **Logs** tab. The initial password is logged on first startup.

### ✅ Verification Checklist

```
□ Backend health endpoint returns {"status":"UP"}
□ Frontend loads the welcome/login page
□ Login works with Platform Owner credentials
□ Dashboard loads with statistics
□ Can create an Organization
□ Can create a Society under the Organization
□ Email features work (try "Forgot Password")
□ Razorpay payment (if keys configured) — test with ₹1
```

<br/>

---

## 📱 10. Mobile App Deployment

The mobile app uses **React Native + Expo** and is distributed **separately** from the Render deployment.

### 📋 Deployment Options

```
╔══════════════════════════════════════════════════════════════════════════╗
║                   MOBILE APP DISTRIBUTION OPTIONS                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  Option 1: Expo Go (Development/Testing)                               ║
║  Option 2: EAS Build → APK/AAB (Android Distribution)                 ║
║  Option 3: EAS Build → IPA (iOS Distribution)                         ║
║  Option 4: Google Play Store (Public Android Release)                  ║
║  Option 5: Apple App Store (Public iOS Release)                        ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 🔧 Step 1: Configure API URL for Production

Before building, update the API base URL to point to your deployed backend:

```javascript
// File: mobile-app/src/constants/index.js

export const API_CONFIG = {
  // ❌ Development (local)
  // BASE_URL: 'http://localhost:8080',

  // ✅ Production (your Render backend URL)
  BASE_URL: 'https://society-backend.onrender.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

> ⚠️ **Replace** `https://society-backend.onrender.com` with your **actual Render backend URL** from the dashboard.

---

### 📲 Option 1: Expo Go (Testing / Demo)

Best for: **Quick testing on physical devices**

```bash
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

| Step | Action |
|:----:|:-------|
| 1 | Install **Expo Go** app on your phone from [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [App Store](https://apps.apple.com/app/expo-go/id982107779) |
| 2 | Run `npx expo start` in terminal |
| 3 | Scan the **QR code** with Expo Go app (Android) or Camera app (iOS) |
| 4 | App loads on your phone! |

> ⚠️ Expo Go requires the device and development machine to be on the **same network** for local dev. For production API, it works independently.

---

### 📦 Option 2: Build APK for Android (Recommended for Distribution)

Best for: **Sharing with users directly without Play Store**

#### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login
```

#### Configure EAS Build

```bash
cd mobile-app

# Initialize EAS (one-time setup)
eas build:configure
```

This creates an `eas.json` file. Configure it as:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "distribution": "store"
      }
    }
  }
}
```

#### Build Android APK

```bash
# Build APK for direct distribution
eas build --platform android --profile preview

# OR Build AAB for Play Store
eas build --platform android --profile production
```

| Build Phase | Duration | Output |
|:------------|:---------|:-------|
| Upload to Expo servers | ~1-2 min | Queued |
| Build on Expo cloud | ~10-20 min | `.apk` or `.aab` file |
| Download link | Available after build | Share this link! |

#### Download & Share APK

After the build completes:

```
✅ Build complete!
📦 Download APK: https://expo.dev/artifacts/eas/xxxxx.apk
```

1. **Download** the APK from the link
2. **Share** it via Google Drive, WhatsApp, email, or direct download
3. Users install it on their Android phones (**enable "Unknown Sources" in Settings**)

---

### 🍎 Option 3: Build for iOS

```bash
# Build for iOS (requires Apple Developer Account - $99/year)
eas build --platform ios --profile production
```

> iOS builds require an **Apple Developer Program** membership ($99/year). For testing, use Expo Go instead.

---

### 🏪 Option 4: Publish to Google Play Store

| Step | Action |
|:----:|:-------|
| 1 | Create a [Google Play Developer Account](https://play.google.com/console/) ($25 one-time fee) |
| 2 | Build AAB: `eas build --platform android --profile production` |
| 3 | Download the `.aab` file from Expo |
| 4 | Go to Play Console → Create App → Upload AAB |
| 5 | Fill in store listing (screenshots, description, icon) |
| 6 | Submit for review → Published within 1-7 days |

---

### 🍏 Option 5: Publish to Apple App Store

| Step | Action |
|:----:|:-------|
| 1 | Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year) |
| 2 | Build IPA: `eas build --platform ios --profile production` |
| 3 | Submit to App Store: `eas submit --platform ios` |
| 4 | Fill in App Store Connect listing |
| 5 | Submit for review → Published within 1-3 days |

---

### 📊 Mobile Deployment Comparison

| Method | Cost | Time | Best For | Android | iOS |
|:-------|:----:|:----:|:---------|:-------:|:---:|
| **Expo Go** | Free | Instant | Testing & demos | ✅ | ✅ |
| **APK (EAS)** | Free | ~20 min | Direct sharing | ✅ | ❌ |
| **Play Store** | $25 (once) | 1-7 days | Public Android release | ✅ | ❌ |
| **App Store** | $99/year | 1-3 days | Public iOS release | ❌ | ✅ |
| **Both Stores** | $124 | 1-7 days | Full public release | ✅ | ✅ |

<br/>

---

## 🙋 11. How Users Access the App

### 🖥️ Admin Web Panel (Browser)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                 ADMIN WEB PANEL — BROWSER ACCESS                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  URL: https://society-admin-web.onrender.com                           ║
║                                                                        ║
║  Works on:                                                             ║
║    ✅ Chrome / Edge / Firefox / Safari (Desktop & Mobile)              ║
║    ✅ Any device with a web browser                                    ║
║    ✅ No installation required                                         ║
║                                                                        ║
║  Who uses it:                                                          ║
║    👑 Platform Owner — Manage all organizations & societies            ║
║    🏢 Organization Owner — Manage own organization's societies         ║
║    🔧 Society Admin — Full society management                         ║
║    🎖️ Chairman / Secretary / Treasurer — Governance & finance          ║
║    📋 Committee / Manager — Operations management                     ║
║                                                                        ║
║  Login:                                                                ║
║    1. Open the URL in browser                                         ║
║    2. Enter email & password provided by your admin                   ║
║    3. Dashboard loads based on your role                              ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 📱 Mobile App (Android / iOS)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                   MOBILE APP — RESIDENT ACCESS                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  Distribution: APK / Play Store / App Store / Expo Go                  ║
║                                                                        ║
║  Who uses it:                                                          ║
║    🏠 Members (Flat Owners) — Bills, notices, complaints, tickets      ║
║    🔑 Tenants — View bills, profile, raise complaints                 ║
║    👷 Employees / Staff — Visitor management, tasks                   ║
║    🎖️ Admins / Committee — Quick access to dashboard on-the-go       ║
║                                                                        ║
║  Installation (Android):                                               ║
║    Option A: Download APK from shared link → Install → Open           ║
║    Option B: Download from Google Play Store → Install → Open         ║
║                                                                        ║
║  Installation (iOS):                                                   ║
║    Option A: Use Expo Go app → Scan QR code                          ║
║    Option B: Download from Apple App Store → Install → Open           ║
║                                                                        ║
║  Login:                                                                ║
║    1. Open the app                                                    ║
║    2. Enter email & password (same as web panel)                      ║
║    3. Role-based dashboard loads:                                     ║
║       • Admin Dashboard (admins)                                      ║
║       • Member Dashboard (members/tenants)                            ║
║       • Staff Dashboard (employees)                                   ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 🔑 User Account Creation Flow

```
Step 1:  Platform Owner logs in → Creates Organization
              │
Step 2:  Platform Owner → Creates Organization Owner
              │
Step 3:  Organization Owner → Creates Society Admin
              │
Step 4:  Society Admin → Creates all society roles:
              │
              ├── Chairman, Secretary, Treasurer
              ├── Committee Members, Manager
              ├── Employees (Staff/Security)
              ├── Members (Flat Owners)
              ├── Tenants (Renters)
              └── Visitors
              
Step 5:  Each user receives their credentials
              │
Step 6:  Users login via Web Panel or Mobile App
         with their email & password
```

### 📋 Access Summary by Role

| Role | Web Panel | Mobile App | First Created By |
|:-----|:---------:|:----------:|:----------------|
| `PLATFORM_OWNER` | ✅ Full Access | ✅ Admin Dashboard | Auto-created on first boot |
| `ORGANIZATION_OWNER` | ✅ Full Access | ✅ Admin Dashboard | Platform Owner |
| `SOCIETY_ADMIN` | ✅ Full Access | ✅ Admin Dashboard | Org Owner / Platform Owner |
| `CHAIRMAN` | ✅ Governance | ✅ Admin Dashboard | Society Admin |
| `SECRETARY` | ✅ Administrative | ✅ Admin Dashboard | Society Admin / Chairman |
| `TREASURER` | ✅ Financial | ✅ Admin Dashboard | Society Admin / Chairman |
| `COMMITTEE` | ✅ Management | ✅ Admin Dashboard | Society Admin / Secretary |
| `MANAGER` | ✅ Operations | ✅ Staff Dashboard | Society Admin |
| `EMPLOYEE` | ✅ Limited | ✅ Staff Dashboard | Society Admin / Committee |
| `MEMBER` | ✅ Own Data | ✅ Member Dashboard | Society Admin / Committee |
| `TENANT` | ✅ Own Profile | ✅ Member Dashboard | Society Admin / Member |
| `VISITOR` | ✅ Minimal | ❌ N/A | Society Admin / Employee |

<br/>

---

## 🔧 12. Troubleshooting

### Common Issues & Fixes

| Issue | Cause | Fix |
|:------|:------|:----|
| Backend shows `{"status":"DOWN"}` | Database not connected | Check if `society-db` is created and healthy in Render dashboard |
| Frontend shows blank page | Build failed | Check **Logs** tab in `society-admin-web` service |
| Login returns 401 | JWT_SECRET not set | Add `JWT_SECRET` to backend environment variables → redeploy |
| CORS errors in browser console | Frontend URL not allowed | `APP_FRONTEND_URL` is auto-set; check if custom domain needs `APP_CORS_ALLOWED_ORIGINS` |
| Email features not working | Gmail credentials wrong | Verify `MAIL_USERNAME` & `MAIL_PASSWORD` (must be App Password, not regular password) |
| "Forgot Password" email not sent | SMTP blocked | Enable "Less secure app access" OR use App Password (recommended) |
| Payment fails | Razorpay keys invalid | Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` — use test keys for testing |
| Backend takes 30-60 sec first load | Free tier cold start | Normal on Render free tier — backend sleeps after 15 min of inactivity |
| Mobile app can't connect to API | Wrong BASE_URL | Update `mobile-app/src/constants/index.js` → `BASE_URL` to your Render backend URL |
| Database expired | 90-day free tier limit | Create a new database and redeploy, or upgrade to paid plan |
| Build fails with Maven error | Java version mismatch | Ensure Render uses Java 21 (check build logs) |

### 📋 Debugging Checklist

```
□ Check backend Logs tab: Render Dashboard → society-backend → Logs
□ Check frontend Logs tab: Render Dashboard → society-admin-web → Logs
□ Verify all env vars are set: society-backend → Environment
□ Test health endpoint: curl https://your-backend.onrender.com/actuator/health
□ Check database: society-db → Info → Connection status
□ Verify CORS: Browser DevTools → Console → look for CORS errors
□ Check network: Browser DevTools → Network → check API calls
```

### 🔄 Force Redeploy

```
Render Dashboard → society-backend → Manual Deploy → "Deploy latest commit"
```

Or push a new commit to trigger auto-deploy:

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

<br/>

---

## 🏗️ 13. Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       DEPLOYED INFRASTRUCTURE                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

   👤 Admin/Staff                        👤 Residents
   (Browser)                             (Mobile Phone)
      │                                       │
      │ HTTPS                                 │ HTTPS
      │                                       │
┌─────▼──────────────────────┐   ┌────────────▼──────────────────┐
│ 🖥️ society-admin-web        │   │ 📱 Society Management App     │
│ (Render Static Site)       │   │ (Android APK / iOS / Expo Go) │
│                            │   │                               │
│ React 19 + Vite            │   │ React Native + Expo           │
│ URL: *.onrender.com        │   │ Installed on device           │
└─────┬──────────────────────┘   └────────────┬─────────────────┘
      │                                       │
      │  API Calls (REST JSON)                │
      └──────────────┬────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │ ⚙️ society-backend     │
         │ (Render Web Service)  │
         │                      │
         │ Spring Boot 3.5      │
         │ Java 21              │
         │ JWT Auth + RBAC      │
         │ URL: *.onrender.com  │
         └───────────┬──────────┘
                     │
         ┌───────────▼───────────┐
         │ 🗄️ society-db          │
         │ (Render PostgreSQL)   │
         │                      │
         │ PostgreSQL 16        │
         │ 21 Tables            │
         │ Auto-connected       │
         └───────────────────────┘
                     │
    ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─
    External Services │
                     │
         ┌───────────▼───────────┐
         │ 💳 Razorpay Gateway   │  Payment processing (INR)
         │ 📧 Gmail SMTP        │  Transactional emails
         └───────────────────────┘
```

<br/>

---

<div align="center">

### 🎉 Your Society Management System is Now Live!

<br/>

| Platform | Access |
|:---------|:-------|
| 🖥️ **Web Panel** | `https://society-admin-web.onrender.com` |
| ⚙️ **Backend API** | `https://society-backend.onrender.com` |
| ❤️ **Health Check** | `https://society-backend.onrender.com/actuator/health` |
| 📱 **Mobile App** | Download APK / Expo Go / App Store |

<br/>

![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Live](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)

<br/>

*Need help? Check [Troubleshooting](#-12-troubleshooting) or open an issue on GitHub.*

</div>
