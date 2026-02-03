# 🔐 ADMIN ACCOUNT MANAGEMENT GUIDE

## ✅ Admin Account Created Successfully!

Your admin account has been created and stored in MongoDB.

---

## 📋 ADMIN LOGIN CREDENTIALS

```
Email:    admin@college.edu
Password: Admin@123
URL:      http://localhost:3000/signin
```

**Role**: Admin (protected from database cleanup)

---

## 🛡️ ADMIN PROTECTION

### What's Protected:
- ✅ Admin accounts are **NEVER deleted** by `clear-database.js`
- ✅ Only students and alumni are removed during cleanup
- ✅ Admin password is pre-set and ready to use

### Modified Scripts:
1. **clear-database.js** - Only deletes students and alumni
2. **create-admin.js** - Creates/updates admin accounts

---

## 🚀 HOW TO USE

### Method 1: Use Existing Admin (FASTEST)
```bash
# Admin is already created!
# Just login at http://localhost:3000/signin

Email: admin@college.edu
Password: Admin@123
```

### Method 2: Run Admin Creation Script Anytime
```bash
cd backend
node create-admin.js
```

**What it does:**
- Checks if admin exists
- If exists → Updates password
- If not exists → Creates new admin
- Always safe to run multiple times

---

## 📊 MANUAL MONGODB STEPS (Alternative Method)

If you prefer to add admin directly via MongoDB Compass or CLI:

### Option A: Using MongoDB Compass (GUI)

1. **Open MongoDB Compass**
2. **Connect** to your database
3. **Select Database**: Your database name (from MONGODB_URI)
4. **Select Collection**: `users`
5. **Click "Add Data" → "Insert Document"**
6. **Paste this JSON**:

```json
{
  "name": "System Administrator",
  "collegeEmail": "admin@college.edu",
  "password": "$2a$10$YourHashedPasswordHere",
  "role": "admin",
  "username": "admin",
  "isVerified": true,
  "passwordInitialized": true,
  "createdAt": {"$date": "2024-02-03T10:00:00.000Z"}
}
```

**⚠️ IMPORTANT**: Password must be bcrypt hashed!

**Better approach**: Use `create-admin.js` script instead (it auto-hashes password)

---

### Option B: Using MongoDB Shell (CLI)

1. **Open MongoDB Shell**:
```bash
mongosh
```

2. **Switch to your database**:
```bash
use your_database_name
```

3. **Insert admin document**:
```javascript
db.users.insertOne({
  name: "System Administrator",
  collegeEmail: "admin@college.edu",
  password: "$2a$10$YourHashedPasswordHere",
  role: "admin",
  username: "admin",
  isVerified: true,
  passwordInitialized: true,
  createdAt: new Date()
})
```

**⚠️ AGAIN**: Password must be bcrypt hashed!

---

### Option C: Using create-admin.js (RECOMMENDED)

**Why this is the best method:**
- ✅ Automatically hashes password
- ✅ Validates data format
- ✅ Updates if admin exists
- ✅ Shows clear success/error messages
- ✅ No manual password hashing needed

**How to use**:
```bash
cd backend
node create-admin.js
```

**To add more admins**, edit `create-admin.js`:
```javascript
const admins = [
    {
        name: 'System Administrator',
        collegeEmail: 'admin@college.edu',
        password: 'Admin@123',
        role: 'admin',
        isVerified: true,
        passwordInitialized: true,
        username: 'admin'
    },
    // ADD NEW ADMIN HERE
    {
        name: 'John Doe',
        collegeEmail: 'john.admin@college.edu',
        password: 'YourSecurePassword@123',
        role: 'admin',
        isVerified: true,
        passwordInitialized: true,
        username: 'john.admin'
    }
];
```

Then run:
```bash
node create-admin.js
```

---

## 🔄 COMMON WORKFLOWS

### Scenario 1: First Time Setup
```bash
# Step 1: Create admin
cd backend
node create-admin.js

# Step 2: Login at http://localhost:3000/signin
Email: admin@college.edu
Password: Admin@123
```

### Scenario 2: Reset Admin Password
```bash
# Edit create-admin.js → Change password → Run:
node create-admin.js

# Script will update existing admin with new password
```

### Scenario 3: Clean Database (Preserve Admin)
```bash
# Clear students and alumni (admin stays safe)
node clear-database.js

# Output will show:
# ✅ Deleted X users (students & alumni)
# ✅ Preserved 1 admin account(s)
```

### Scenario 4: Add Multiple Admins
```javascript
// Edit create-admin.js
const admins = [
    {
        name: 'Primary Admin',
        collegeEmail: 'admin@college.edu',
        password: 'Admin@123',
        // ...
    },
    {
        name: 'Secondary Admin',
        collegeEmail: 'admin2@college.edu',
        password: 'Admin2@456',
        // ...
    }
];
```

```bash
node create-admin.js
```

---

## ⚠️ SECURITY BEST PRACTICES

### DO:
- ✅ Change default password after first login
- ✅ Use strong passwords (min 12 chars, mixed case, numbers, symbols)
- ✅ Store credentials in secure password manager
- ✅ Run `create-admin.js` only when needed
- ✅ Limit number of admin accounts

### DON'T:
- ❌ Share admin credentials with students/alumni
- ❌ Use same password for multiple admins
- ❌ Store passwords in plain text files
- ❌ Commit admin passwords to Git
- ❌ Run `clear-database.js` expecting to delete admins

---

## 🧪 VERIFICATION STEPS

### Check if admin exists:
```bash
cd backend
node debug-scripts.js
```

Edit `debug-scripts.js`:
```javascript
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAdmin = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admins = await User.find({ role: 'admin' });
    console.log(`Admin count: ${admins.length}`);
    
    admins.forEach(admin => {
        console.log(`- ${admin.name} (${admin.collegeEmail})`);
    });
    
    process.exit(0);
};

checkAdmin();
```

---

## 📝 DATABASE SCHEMA (Admin User)

```javascript
{
  _id: ObjectId("..."),
  name: "System Administrator",
  collegeEmail: "admin@college.edu",
  password: "$2a$10$...", // bcrypt hashed
  role: "admin",
  username: "admin",
  isVerified: true,
  passwordInitialized: true,
  createdAt: ISODate("2024-02-03T10:00:00.000Z"),
  updatedAt: ISODate("2024-02-03T10:00:00.000Z")
}
```

---

## 🎯 SUMMARY

| Method | Difficulty | Recommended |
|--------|-----------|-------------|
| Use existing admin | ⭐ Easy | ✅ YES |
| Run create-admin.js | ⭐⭐ Easy | ✅ YES |
| MongoDB Compass | ⭐⭐⭐ Medium | ⚠️ Manual hashing needed |
| MongoDB Shell | ⭐⭐⭐⭐ Hard | ⚠️ Manual hashing needed |

**Best Practice**: Use `create-admin.js` for all admin management!

---

## ✅ QUICK REFERENCE

**Login as Admin:**
```
URL: http://localhost:3000/signin
Email: admin@college.edu
Password: Admin@123
```

**Create/Update Admin:**
```bash
cd backend
node create-admin.js
```

**Clear Database (Preserve Admin):**
```bash
cd backend
node clear-database.js
```

**Check Admin Exists:**
```bash
cd backend
node debug-scripts.js
```

---

**Your admin account is now safe and permanent!** 🎉
