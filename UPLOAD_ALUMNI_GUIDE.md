# How to Upload Alumni Data to Database

## ✅ **Your Alumni CSV File is Ready!**

The file `alumni_clean.csv` contains **49 alumni records** with complete information:
- Names, Companies, Job Roles
- Skills (React, Python, Machine Learning, etc.)
- Departments (CS, IT, Electronics, Mechanical, Civil, Electrical)
- LinkedIn & GitHub profiles
- Locations and Salaries

---

## 📋 **Upload Steps**

### **Option 1: Using Admin Dashboard (Recommended)**

1. **Start Both Servers** (if not already running):
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd ..
   npm run dev
   ```

2. **Login as Admin**:
   - Open browser: http://localhost:8081
   - Email: `admin@university.edu`
   - Password: `Admin@2024`

3. **Upload the CSV**:
   -  Go to **Admin Dashboard**
   - Find **"Upload Alumni CSV"** section
   - Click "Choose File"
   - Select: `backend/sample-csv/alumni_clean.csv`
   - Click **"Upload"**

4. **Verify Alumni**:
   - After upload, you'll see all 49 alumni in the "Pending Verification" list
   - Click **"Verify All"** or verify them individually
   - Once verified, they'll appear in the "Find Mentors" page!

---

### **Option 2: Using Upload Script**

1. **Ensure Backend is Running**:
   ```bash
   cd backend
   npm run dev
   # Should show: "Server running on port 5000"
   ```

2. **Run Upload Script**:
   ```bash
   # In a new terminal
   cd backend
   node upload-alumni-clean.js
   ```

3. **Expected Output**:
   ```
   ✅ Admin login successful
   📤 Uploading: alumni_clean.csv
   ✅ Alumni uploaded successfully!
   
   📊 Upload Summary:
      ├─ Total rows processed: 49
      ├─ Successfully inserted: 49
      └─ Skipped (duplicates): 0
   
   👥 Sample Alumni Added:
      1. Arjun Mehta - Google (Senior Software Engineer)
      2. Kavya Nair - Microsoft (Cloud Solutions Architect)
      3. Rohan Das - Amazon (Data Scientist)
      ... and 46 more
   ```

4. **Verify in Admin Dashboard**:
   - Login as admin
   - Go to Users section
   - You'll see 49 new alumni accounts
   - Click "Verify All"

---

## 🔍 **Testing the Matching Feature**

Once alumni are uploaded and verified:

1. **Login as Student**:
   - Email: `jane.smith@university.edu`
   - Password: `Student@2024`

2. **Go to "Find Mentors"** page

3. **Try Different Searches**:

   **Search by Domain:**
   - Click "Web Development" → See 7 alumni (Priya Sharma, Aditya Verma, etc.)
   - Click "AI/ML" → See 5 alumni (Arjun Mehta, Ananya Iyer, etc.)
   - Click "Cloud Computing"  → See 3 alumni (Kavya Nair, etc.)

   **Search by Skills:**
   - Type "React" → Find frontend developers
   - Type "Python" → Find AI/ML and data science alumni
   - Type "AWS, Docker" → Find DevOps engineers

4. **Check Match Scores**:
   - Each alumni shows a percentage match
   - Higher scores = better skill/interest alignment

---

## 📊 **What's in the CSV**

### Top 10 Alumni (from alumni_clean.csv):

| Name | Company | Role | Skills | Department |
|------|---------|------|--------|-----------|
| Arjun Mehta | Google | Senior Software Engineer | Python, TensorFlow, React | Computer Science |
| Kavya Nair | Microsoft | Cloud Solutions Architect | Azure, Docker, Kubernetes | Information Technology |
| Rohan Das | Amazon | Data Scientist | Python, Pandas, SQL | Computer Science |
| Ananya Iyer | Meta | ML Engineer | PyTorch, Computer Vision | Electronics |
| Karthik Reddy | Apple | iOS Developer | Swift, iOS SDK | Computer Science |
| Priya Sharma | Adobe | Frontend Developer | React, TypeScript, CSS | Information Technology |
| Vikram Singh | Flipkart | Backend Engineer | Java, Spring Boot | Computer Science |
| Sneha Patel | Intel | Hardware Engineer | Verilog, VHDL | Electronics |
| Aditya Verma | Paytm | Full Stack Developer | React, Node.js, MongoDB | Information Technology |
| Ishita Gupta | Uber | Software Engineer | Python, Django | Computer Science |

...and 39 more amazing alumni! 

---

## ⚠️ **Troubleshooting**

### "Backend server not running"
- Make sure `npm run dev` is running in the `backend` folder
- Check: http://localhost:5000/health should return `{"success":true}`

### "Admin login failed"
- Default admin credentials:
  - Email: `admin@university.edu`
  - Password: `Admin@2024`

### "Alumni not appearing in search"
- Make sure alumni are **verified** in Admin Dashboard
- Alumni must have `isVerified: true` to appear in search results

### "No matching alumni found"
- Try searching without filters first (shows all alumni)
- Check that alumni were uploaded successfully
- Verify backend connection is working

---

## ✅ **Success Checklist**

- [ ] Backend server running (http://localhost:5000)
- [ ] Frontend server running (http://localhost:8081)
- [ ] Admin logged in successfully
- [ ] alumni_clean.csv uploaded
- [ ] All 49 alumni verified
- [ ] Student login works
- [ ] "Find Mentors" page shows alumni
- [ ] Search and filter working
- [ ] Match scores calculating correctly

---

## 📝 **Quick Commands**

```bash
# Start backend
cd backend && npm run dev

# Start frontend
npm run dev

# Upload alumni (Option 2)
cd backend && node upload-alumni-clean.js

# Check backend health
curl http://localhost:5000/health

# Check database (in MongoDB Compass)
# Connection: mongodb://localhost:27017/alumni-management
# Collection: users
# Filter: { role: "alumni", isVerified: true }
```

---

**Last Updated**: February 2026  
**Status**: Ready to Upload ✅

Upload these alumni and your matching page will show real data from your database!
