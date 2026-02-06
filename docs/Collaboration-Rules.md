# 🧭 Team Git Workflow (Per-Member Branch Model)

This document defines the **mandatory Git workflow** for this repository after the `main` history cleanup.
Follow this strictly to keep Git **clean, predictable, and stress-free** 😌

---

## 🌳 Branch Structure

* **`main`** → 🟢 **Single source of truth**

  * Always clean
  * Always linear
  * Always stable

* **Per-member branches** (👤 personal workspaces):

  * `Atharva`
  * `Nidhish`
  * `Parth`
  * `yash`
  * `Tanmay`

> 🔐 **Rule:** Each member commits **only to their own branch**
> Think of these as *personal sandboxes* 🏖️

---

## 🚨 Rule 0 (VERY IMPORTANT)

If you remember nothing else, remember this 👇

* ❌ **DO NOT** commit directly on `main`
* ❌ **DO NOT** merge `main` into your branch
* ❌ **DO NOT** use `git pull`
* ✅ Only  **Tanmay (Repo Owner)** is allowed to merge into `main branch`

Breaking these rules = broken history ⚠️

---

## ⚙️ One-Time Setup (Mandatory for Everyone)

Run these commands **once** on your system:

```bash
git config --global pull.rebase true
git config --global rebase.autoStash true
```

### Why this matters 🧠

* Prevents accidental merge commits
* Keeps history linear
* Saves you from Git hell 🔥

---

## 🔁 Daily Workflow (For Every Team Member)

Follow these steps **every day before coding** 👇

---

### 1️⃣ Sync with the latest clean `main`

```bash
git fetch origin
git checkout main
git reset --hard origin/main
```

✅ Ensures your local `main` matches the clean, official history
❌ Never use `git pull`

---

### 2️⃣ Switch to your personal branch

Example for **Atharva**:

```bash
git checkout Atharva
git reset --hard main
```

🧼 This resets your branch to be **exactly the same as `main`**
No old commits, no confusion.

---

### 3️⃣ Work and commit on your branch

```bash
git add .
git commit -m "feat: clear, meaningful message"
```

📝 Commit tips:

* ✅ Small, logical commits
* ✅ Clear messages
* ❌ Don’t dump everything in one commit

---

### 4️⃣ Push ONLY your branch

Example:

```bash
git push origin Atharva
```

🚫 **Never push `main`**
🚫 **Never force-push `main`**

---

## 🔀 How Changes Reach `main` (ONLY by Tanmay)

Team members **do not merge to `main` themselves**.

---

### ✅ Option A: GitHub Pull Request (Recommended)

* Open PR:

  ```
  your-branch → main
  ```

* Allowed merge methods:

  * ✅ **Rebase and merge**
  * ✅ **Squash and merge**

❌ **DO NOT** use **Create merge commit**

---

### ⚡ Option B: Local Fast-Forward Merge (No PR)

Done **only by Tanmay**:

```bash
git checkout main
git reset --hard origin/main
git merge --ff-only Atharva
git push origin main
```

This guarantees:

* No merge commits
* No graph mess
* Clean history 📈

---

## ⛔ Hard Rules (Must Follow)

These are **non-negotiable** ❗

* ❌ `git pull`
* ❌ `git merge main`
* ❌ Commit on `main`
* ❌ Force-push `main`

If unsure → **ask before running commands** 🙋‍♂️

---

## 🧠 Mental Model (Easy to Remember)

> 🛡️ **`main` = sacred timeline**
> 🏖️ **Name branches = personal sandboxes**

Sandboxes can be:

* Reset
* Rewritten
* Deleted

`main` must stay **pure and linear forever** ♾️

---

## 🎯 Expected Result

If everyone follows this:

* ✅ Clean, straight Git graph
* ✅ No merge-conflict chaos
* ✅ Easy debugging & rollback
* ✅ Git works like a **time machine ⏳**, not hell 😈

---

## 📌 Final Note

⚠️ **This workflow is mandatory for all contributors.**
Breaking it affects the entire team. 

## Thank You !!