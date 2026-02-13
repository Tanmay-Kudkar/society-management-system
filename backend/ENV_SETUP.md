# 🔐 Environment Variables Setup — Society Management System

> ### What is this?
> Instead of putting passwords and secrets directly in code files, we store them as  
> **environment variables** on your computer. This keeps sensitive info safe and  
> makes it easy for each developer to use their own credentials.

---

## 📋 Before You Begin

You'll need:
- ✅ **PostgreSQL** installed and running on your machine
- ✅ Your **PostgreSQL password** (the one you set during installation)
- ✅ A **Gmail account** with an App Password (for sending emails)
- ✅ **PowerShell** (already on Windows — no admin rights needed)

> 💡 **How it works:** You run each command once. It saves the value permanently on  
> your Windows account — it survives reboots, terminal restarts, everything.

---

## 📖 Step-by-Step Setup

### Step 1 — 🗄️ Database Connection

These tell the backend how to connect to your local PostgreSQL database.

```powershell
[System.Environment]::SetEnvironmentVariable("DB_URL", "jdbc:postgresql://localhost:5432/society_db", "User")
[System.Environment]::SetEnvironmentVariable("DB_USERNAME", "postgres", "User")
[System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "YOUR_REAL_DB_PASSWORD", "User")
```

> ⚠️ **Important:** Replace `YOUR_REAL_DB_PASSWORD` with the actual password you  
> chose when installing PostgreSQL. For example, if your password is `mypass123`:
> ```powershell
> [System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "mypass123", "User")
> ```

| What | Why | Example Value |
|------|-----|---------------|
| `DB_URL` | Where is the database? | `jdbc:postgresql://localhost:5432/society_db` |
| `DB_USERNAME` | Which user to log in as | `postgres` (default PostgreSQL user) |
| `DB_PASSWORD` | Password for that user | The one **you** set during install |

---

### Step 2 — 🔑 JWT Secret (Login Tokens)

This secret key is used to create secure login tokens. When a user logs in,  
the backend signs a token with this key so it can't be tampered with.

```powershell
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "VGhpc0lzQVN1ZmZpY2llbnRseUxvbmdSYW5kb21TZWN1cmVLZXk=", "User")
```

> 💡 The value above works fine for **local development**. For production,  
> generate a fresh one with:  
> ```powershell
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
> ```

---

### Step 3 — 📧 Email Sending (Gmail)

The app sends emails for password resets, notifications, etc. These credentials  
let it send emails through Gmail's servers.

```powershell
[System.Environment]::SetEnvironmentVariable("MAIL_USERNAME", "kudkartanmay25@gmail.com", "User")
[System.Environment]::SetEnvironmentVariable("MAIL_PASSWORD", "kjqxuljqoflphewp", "User")
```

| What | Why |
|------|-----|
| `MAIL_USERNAME` | The Gmail address emails are sent **from** |
| `MAIL_PASSWORD` | A special **App Password** (not your Gmail login password!) |

> 🛡️ **What's an App Password?**  
> Google doesn't let apps use your real password. Instead, you generate a  
> 16-character code just for this app.  
> **How to get one:** [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)  
> (Requires 2-Step Verification to be turned on)

---

### Step 4 — ⚙️ App Settings

General application settings.

```powershell
[System.Environment]::SetEnvironmentVariable("APP_ADMIN_EMAIL", "kudkartanmay25@gmail.com", "User")
[System.Environment]::SetEnvironmentVariable("APP_FRONTEND_URL", "http://localhost:5173", "User")
```

| What | Why | When to Change |
|------|-----|----------------|
| `APP_ADMIN_EMAIL` | Admin receives system notifications here | Change to your email |
| `APP_FRONTEND_URL` | Used in email links & CORS security | Change only if frontend runs on a different port |

---

### Step 5 — 🔄 Restart Your Terminal

**Environment variables don't take effect in already-open terminals.**

1. Close VS Code completely
2. Reopen VS Code  
3. Open a new terminal (`Ctrl + ~`)

---

## 🚀 Quick Copy-Paste (All Commands at Once)

If you understand each step above, copy this entire block, **replace `YOUR_REAL_DB_PASSWORD`**,  
paste into PowerShell, and hit Enter:

```powershell
# 🗄️ Database
[System.Environment]::SetEnvironmentVariable("DB_URL", "jdbc:postgresql://localhost:5432/society_db", "User")
[System.Environment]::SetEnvironmentVariable("DB_USERNAME", "postgres", "User")
[System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "YOUR_REAL_DB_PASSWORD", "User")

# 🔑 JWT
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "VGhpc0lzQVN1ZmZpY2llbnRseUxvbmdSYW5kb21TZWN1cmVLZXk=", "User")

# 📧 Email
[System.Environment]::SetEnvironmentVariable("MAIL_USERNAME", "kudkartanmay25@gmail.com", "User")
[System.Environment]::SetEnvironmentVariable("MAIL_PASSWORD", "kjqxuljqoflphewp", "User")

# ⚙️ App
[System.Environment]::SetEnvironmentVariable("APP_ADMIN_EMAIL", "kudkartanmay25@gmail.com", "User")
[System.Environment]::SetEnvironmentVariable("APP_FRONTEND_URL", "http://localhost:5173", "User")
```

---

## ✅ Verify Everything Worked

After restarting your terminal, run this to check all variables are set:

```powershell
"DB_URL", "DB_USERNAME", "DB_PASSWORD", "JWT_SECRET", "MAIL_USERNAME", "MAIL_PASSWORD", "APP_ADMIN_EMAIL", "APP_FRONTEND_URL" | ForEach-Object {
    $val = [System.Environment]::GetEnvironmentVariable($_, "User")
    if ($val) { Write-Host "  ✅ $_ = $val" -ForegroundColor Green }
    else { Write-Host "  ❌ $_ — NOT SET!" -ForegroundColor Red }
}
```

**Expected output** — everything should be green:
```
  ✅ DB_URL = jdbc:postgresql://localhost:5432/society_db
  ✅ DB_USERNAME = postgres
  ✅ DB_PASSWORD = ****
  ✅ JWT_SECRET = ****
  ✅ MAIL_USERNAME = ****
  ✅ MAIL_PASSWORD = ****
  ✅ APP_ADMIN_EMAIL = ****
  ✅ APP_FRONTEND_URL = http://localhost:5173
```

---

## 🏃 Start the Backend

Once all variables are green, start the Spring Boot server:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

You should see `Started BackendApplication` in the logs — the app is running on `http://localhost:8080` 🎉

---

## 🗑️ Need to Remove Everything? (Cleanup)

If you ever want to delete all these environment variables:

```powershell
"DB_URL", "DB_USERNAME", "DB_PASSWORD", "JWT_SECRET", "MAIL_USERNAME", "MAIL_PASSWORD", "APP_ADMIN_EMAIL", "APP_FRONTEND_URL" | ForEach-Object {
    [System.Environment]::SetEnvironmentVariable($_, $null, "User")
    Write-Host "  🗑️ Removed $_" -ForegroundColor Yellow
}
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| 🔴 `password authentication failed` | Your `DB_PASSWORD` doesn't match PostgreSQL. Check with pgAdmin or reset it. |
| 🔴 `Connection refused` on port 5432 | PostgreSQL isn't running. Start it from Windows Services (`services.msc` → PostgreSQL). |
| 🔴 Variables show as NOT SET | Did you restart the terminal after setting them? Close & reopen VS Code. |
| 🔴 Emails not sending | Make sure `MAIL_PASSWORD` is a Gmail **App Password**, not your regular login. |
| 🔴 CORS errors in browser | Check `APP_FRONTEND_URL` matches your actual frontend address. |
