# 🚀 Production Deployment Checklist

## ✅ Issues Fixed

### Security Fixes
- ✅ Removed hardcoded email credentials from `application.properties`
- ✅ Removed hardcoded admin email default
- ✅ Added proper SLF4J logging (replaced all `System.out/err.println`)
- ✅ Configured proper logging levels for production
- ✅ Enabled Actuator health endpoint for Render monitoring

### Configuration Updates
- ✅ Added `/actuator/health` endpoint configuration
- ✅ Set SQL logging to WARN level in production
- ✅ Environment variables properly configured in `render.yaml.production`

---

## 🔴 CRITICAL: Manual Setup Required

### 1. Generate JWT Secret (REQUIRED)

**Generate a strong 256-bit (32+ character) secret:**

```powershell
# PowerShell - Generate random 32-byte base64 secret
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Copy the output** (e.g., `a7d8f3b9e2c4f1a5b8d3e7c9f2a6b4d8e1c7f3a9b5d2e8c4f7a3b9d6e2c8f5a1`)

---

### 2. Gmail App Password Setup (REQUIRED for Email Features)

1. **Enable 2-Step Verification** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)" → Enter "Society Management System"
   - Copy the **16-character app password** (e.g., `abcd efgh ijkl mnop`)

---

### 3. Razorpay Production Keys (REQUIRED for Payments)

1. **Sign up for Razorpay** (if you haven't):
   - Go to: https://dashboard.razorpay.com/signup

2. **Switch to Live Mode:**
   - In Razorpay Dashboard → Toggle "Test Mode" to "Live Mode" (top-left)

3. **Get Production Keys:**
   - Go to: Settings → API Keys → Generate Key
   - Copy `Key ID` (starts with `rzp_live_...`)
   - Copy `Key Secret` (never share this!)

⚠️ **WARNING:** Never commit production keys to Git!

---

## 📋 Deployment Steps

### Step 1: Update `render.yaml`

Replace your current `render.yaml` with the production version:

```powershell
# Navigate to project root
cd "d:\Mini-Project\society-management-system"

# Backup current render.yaml
Copy-Item render.yaml render.yaml.backup

# Replace with production version
Copy-Item render.yaml.production render.yaml
```

---

### Step 2: Commit and Push Changes

```powershell
git add .
git commit -m "Production deployment configuration

- Remove hardcoded credentials from application.properties
- Add proper logging configuration
- Enable Actuator health endpoint
- Configure all environment variables in render.yaml"

git push origin main
```

---

### Step 3: Configure Render Environment Variables

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Select your `society-backend` service**
3. **Navigate to**: Environment → Environment Variables
4. **Click**: "Add Environment Variable"

**Add these CRITICAL variables:**

| Key | Value | Where to Get |
|-----|-------|--------------|
| `JWT_SECRET` | `[Your generated 32+ char secret]` | From Step 1 PowerShell command |
| `MAIL_USERNAME` | `your-email@gmail.com` | Your Gmail address |
| `MAIL_PASSWORD` | `abcd efgh ijkl mnop` | From Step 2 App Password (remove spaces) |
| `RAZORPAY_KEY_ID` | `rzp_live_XXXXXXXXXXXXX` | From Step 3 Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | `XXXXXXXXXXXXXXXXXXXXXXXX` | From Step 3 Razorpay Dashboard |
| `APP_ADMIN_EMAIL` | `your-admin@example.com` | Your production admin email |

5. **Click**: "Save Changes"

⚠️ **IMPORTANT:** After saving, Render will automatically redeploy your backend.

---

### Step 4: Verify Deployment

1. **Check Backend Health:**
   ```
   https://society-backend-XXXX.onrender.com/actuator/health
   ```
   Should return: `{"status":"UP"}`

2. **Check Frontend Loading:**
   ```
   https://society-admin-web-XXXX.onrender.com
   ```
   Should display login page

3. **Test Login:**
   - Email: `admin@example.com`
   - Password: `admin123`
   
   ⚠️ **Change this password immediately after first login!**

4. **Check Logs:**
   - Backend: Render Dashboard → society-backend → Logs
   - Look for: `✅ PLATFORM OWNER CREATED` (first deployment only)
   - Verify: No error messages

---

## 🔍 Post-Deployment Verification

### Backend Health Check
```powershell
# Test health endpoint
curl https://society-backend-XXXX.onrender.com/actuator/health
```

### Frontend API Connection
```powershell
# Test CORS and API connectivity (should return 401 Unauthorized - expected)
curl https://society-backend-XXXX.onrender.com/api/users/me -X GET
```

### Email Functionality Test
1. Login to admin dashboard
2. Go to: Forgot Password
3. Enter your `MAIL_USERNAME` email
4. Check inbox for password reset email
5. **If email not received:**
   - Check Render logs for email errors
   - Verify `MAIL_USERNAME` and `MAIL_PASSWORD` are correct
   - Ensure Gmail 2-Step Verification is enabled

### Payment Gateway Test
1. Login as PLATFORM_OWNER
2. Create a test society and maintenance bill
3. Try to make a payment
4. Verify Razorpay payment page loads
5. **If payment fails:**
   - Check Render logs for Razorpay errors
   - Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are production keys (not test)

---

## 🐛 Troubleshooting

### Issue: "Service Unhealthy" on Render

**Cause:** `/actuator/health` endpoint not responding

**Fix:**
1. Check backend logs for startup errors
2. Verify PostgreSQL database is connected
3. Check if all environment variables are set

```powershell
# Check if health endpoint is accessible
curl https://society-backend-XXXX.onrender.com/actuator/health
```

---

### Issue: "CORS Error" on Frontend

**Cause:** Frontend URL not whitelisted in CORS configuration

**Fix:**
1. Verify `APP_CORS_ALLOWED_ORIGINS` is set in Render
2. Check backend logs for CORS errors
3. Ensure `JWT_COOKIE_SECURE=true` is set

---

### Issue: "JWT Token Invalid"

**Cause:** JWT secret changed after deployment

**Fix:**
1. **DO NOT change `JWT_SECRET` after deployment** (invalidates all sessions)
2. If you must change it, all users will need to re-login

---

### Issue: "Email Sending Failed"

**Cause:** Invalid Gmail App Password or 2-Step Verification not enabled

**Fix:**
1. Verify 2-Step Verification is enabled
2. Regenerate Gmail App Password
3. Update `MAIL_PASSWORD` in Render (remove spaces from app password)
4. Check backend logs for detailed error

---

### Issue: "Payment Gateway Not Loading"

**Cause:** Using test keys instead of production keys

**Fix:**
1. Go to Razorpay Dashboard → Switch to "Live Mode"
2. Generate new production API keys
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render
4. Redeploy backend

---

## 🔐 Security Best Practices

### Immediate Actions After Deployment

1. **Change Default Password:**
   - Login: `admin@example.com` / `admin123`
   - Go to: Profile → Change Password
   - Use strong password (12+ chars, mixed case, numbers, symbols)

2. **Secure Environment Variables:**
   - Never commit secrets to Git
   - Use Render's Environment Groups for shared secrets
   - Rotate JWT secret every 6 months

3. **Enable HTTPS Only:**
   - Render provides free SSL certificates
   - Verify all URLs use `https://` (not `http://`)

4. **Monitor Logs Regularly:**
   - Check for failed login attempts
   - Monitor for unusual API activity
   - Set up log alerts in Render

---

## 📊 Monitoring & Maintenance

### Weekly Checks
- [ ] Review Render logs for errors
- [ ] Check database usage (Render free tier: 1GB limit)
- [ ] Monitor API response times

### Monthly Checks
- [ ] Review failed email deliveries
- [ ] Check payment gateway transaction logs
- [ ] Update dependencies (if security patches available)

### Quarterly Checks
- [ ] Rotate JWT secret
- [ ] Regenerate Gmail App Password
- [ ] Review and update Razorpay keys

---

## 📞 Support

### If You Encounter Issues

1. **Check Render Logs:**
   - Dashboard → society-backend → Logs
   - Look for stack traces or error messages

2. **Check Database Connection:**
   ```powershell
   # From Render Shell (society-backend → Shell)
   echo $DB_URL
   ```

3. **Verify Environment Variables:**
   - Render Dashboard → society-backend → Environment
   - Ensure all CRITICAL variables are set

4. **Contact Support:**
   - Render Support: https://render.com/support
   - GitHub Issues: [Your repo URL]

---

## 🎉 Deployment Complete!

Your Society Management System is now live in production! 🚀

**Next Steps:**
1. ✅ Change default admin password
2. ✅ Create your first society
3. ✅ Test all features (users, flats, bills, payments)
4. ✅ Share the platform with stakeholders

**Production URLs:**
- **Backend API:** `https://society-backend-XXXX.onrender.com`
- **Admin Dashboard:** `https://society-admin-web-XXXX.onrender.com`
- **Health Check:** `https://society-backend-XXXX.onrender.com/actuator/health`

---

## 🔧 Advanced Configuration

### Custom Domain Setup (Optional)

1. Purchase domain (e.g., `societyhub.com`)
2. In Render Dashboard:
   - society-admin-web → Settings → Custom Domain
   - Add: `www.societyhub.com`
3. Update DNS records as instructed by Render
4. SSL certificate will be auto-provisioned

### Database Backup (Recommended)

Render free tier doesn't include automatic backups. Use:

```powershell
# Manual PostgreSQL backup (from local machine)
pg_dump $DB_URL > backup_$(Get-Date -Format "yyyy-MM-dd").sql
```

Schedule this monthly or use Render's paid plan for automatic backups.

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")
**Version:** 1.0.0
