# Controlled Merge-by-Lead Workflow (Mini Project)



- Everyone will work on the **same codebase**
- Everyone will try the **same new feature**
- **Only the working version** goes to `main`
- **Project Lead** decide what gets merged to main


---

## ✅ Our Project Workflow Rules :

### 🔑 Core Rule

> **No one pushes directly to `main` except the project lead.**

### Everyone else:
- Works on their own branch  
- Pushes only to their branch  
- Informs the lead when a feature works  

### Project Lead:
- Reviews  
- Tests  
- Merges the best implementation into `main`  

---

## How Everyone Should Work

### 1️⃣ Pull Latest `main` Before Starting  
*(Very important – avoids conflicts)*

```bash
git checkout main
git pull origin main
git checkout <your-branch>
```

**Example:**
```bash
git checkout main
git pull origin main
git checkout Nidhish
```

---

### 2️⃣ Implement the Same Feature Independently

- All members may try the **same feature**
- Each works only on their **own branch**
- Same files may be modified
- Different logic is allowed


---

### 3️⃣ Push Only to Your own Branch

```bash
git add .
git commit -m "Implement feature"
git push origin <your-branch>
```

❌ Do NOT merge  
❌ Do NOT push to `main`  

---

### 4️⃣ Inform the Project Lead

After confirming the feature works locally, inform the lead (WhatsApp / Call / Personally):

> “Feature is working on my branch. Please check.”

---

## Project Lead Responsibilities

### 5️⃣ Test the Feature

```bash
git checkout <member-branch>
```

- Run the project
- Test the feature
- Decide:
  - ✅ Works → merge
  - ❌ Broken → reject

---

### 6️⃣ Merge the Best Version into `main`

```bash
git checkout main
git pull origin main
git merge <member-branch>
git push origin main
```

Now `main` contains the working version.

---

### 7️⃣ Sync After Merge (Everyone should follow)

After a merge, everyone must update their branch:

```bash
git checkout main
git pull origin main
git checkout <your-branch>
git merge main
```

---

## If Multiple People Modify the Same File

That is completely fine.

- Only **one implementation** is merged
- Others learn by comparing approaches
- No work is considered wasted

---

## Why This Workflow Works

- Encourages experimentation  
- Keeps `main` stable  
- Prevents demo failures  
- Allows learning with control  
- Simple to follow  



## Summary

- Everyone codes ✔️  
- Everyone experiments ✔️  
- Only one person (Team Lead) merges to `main`✔️  
- `main branch` stays stable ✔️  
- Demo never breaks ✔️  
```