# Alumni Management System - Backend

A complete Node.js + Express + MongoDB backend for Alumni Management System with Job Module and CSV Upload features.

## 🚀 Features

### 1️⃣ **Job Module with Role-Based Access Control**

#### **STUDENT** (Role: `student`)
- ✅ View all job listings
- ✅ Apply for jobs (redirects to company website)
- ❌ Cannot post jobs
- ❌ Cannot delete jobs

#### **ALUMNI** (Role: `alumni`)
- ✅ View all job listings
- ✅ Post new jobs
- ✅ Delete ONLY their own jobs
- ✅ Update status of their own jobs
- ❌ Cannot edit/delete other alumni's jobs

#### **ADMIN** (Role: `admin`)
- ✅ Full access to all job operations
- ✅ Delete any job
- ✅ Update any job status
- ✅ Upload CSV files for bulk user creation

### 2️⃣ **Job Apply - Redirect Logic**

When a student clicks "Apply Job":
- No resume storage
- No application data stored
- Simply **redirects** to the company's official website
- Endpoint: `GET /api/jobs/:jobId/apply`

### 3️⃣ **CSV Upload - Admin Only**

Two CSV upload endpoints for bulk user creation:

#### **A) Student CSV Upload**
- Endpoint: `POST /api/csv/upload-students`
- Required fields:
  - `name`
  - `collegeEmail`
  - `rollNumber`
  - `department`
  - `yearOfStudy`

#### **B) Alumni CSV Upload**
- Endpoint: `POST /api/csv/upload-alumni`
- Required fields:
  - `name`
  - `collegeEmail`
  - `graduationYear`
  - `currentCompany`
  - `role`
  - `domain`
  - `location`

### 4️⃣ **CSV Processing Features**
- ✅ Validates all required fields
- ✅ Auto-generates secure passwords
- ✅ Assigns correct roles (`student` / `alumni`)
- ✅ Saves to MongoDB
- ✅ Skips duplicates (based on `collegeEmail`)
- ✅ Returns detailed upload summary:
  - Total rows processed
  - Successfully inserted count
  - Skipped count
  - Detailed error list

### 5️⃣ **Security**
- ✅ JWT authentication for all protected routes
- ✅ Role-based authorization middleware
- ✅ Admin-only access for CSV upload routes
- ✅ Alumni ownership verification before job deletion
- ✅ Students blocked from job post/delete APIs
- ✅ Password hashing with bcrypt

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Setup Steps

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alumni-management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

5. **Start MongoDB** (if running locally)
```bash
mongod
```

6. **Run the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📍 API Endpoints

### **Authentication Routes** (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "collegeEmail": "john@college.edu",
  "password": "password123",
  "role": "student",
  "rollNumber": "2024001",
  "department": "Computer Science",
  "yearOfStudy": 2
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "collegeEmail": "john@college.edu",
  "password": "password123"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### **Job Routes** (`/api/jobs`)

#### Get All Jobs (All authenticated users)
```http
GET /api/jobs
Authorization: Bearer <token>

# Query parameters (optional):
# ?status=active
# ?location=Bangalore
# ?jobType=full-time
# ?search=developer
```

#### Get Single Job
```http
GET /api/jobs/:id
Authorization: Bearer <token>
```

#### Apply for Job (Students only - REDIRECTS)
```http
GET /api/jobs/:id/apply
Authorization: Bearer <token>
```

#### Create Job (Alumni & Admin only)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "companyWebsiteURL": "https://techcorp.com/careers/apply",
  "description": "Looking for talented developers...",
  "location": "Bangalore",
  "jobType": "full-time",
  "salary": {
    "min": 500000,
    "max": 800000,
    "currency": "INR"
  },
  "experienceRequired": "0-2 years",
  "skills": ["JavaScript", "React", "Node.js"],
  "deadline": "2024-12-31"
}
```

#### Update Job Status (Alumni own jobs & Admin)
```http
PATCH /api/jobs/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "closed"
}
```

#### Delete Job (Alumni own jobs & Admin)
```http
DELETE /api/jobs/:id
Authorization: Bearer <token>
```

---

### **CSV Upload Routes** (`/api/csv`) - **Admin Only**

#### Upload Student CSV
```http
POST /api/csv/upload-students
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

csvFile: <file.csv>
```

**Response:**
```json
{
  "success": true,
  "message": "CSV processing completed",
  "summary": {
    "totalRows": 100,
    "inserted": 95,
    "skipped": 5,
    "errors": [
      {
        "row": 23,
        "email": "duplicate@college.edu",
        "error": "User with this email already exists"
      }
    ]
  }
}
```

#### Upload Alumni CSV
```http
POST /api/csv/upload-alumni
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

csvFile: <file.csv>
```

## 📊 CSV File Templates

### **Student CSV Template**
Create a file named `students.csv`:

```csv
name,collegeEmail,rollNumber,department,yearOfStudy
John Doe,john.doe@college.edu,2024001,Computer Science,2
Jane Smith,jane.smith@college.edu,2024002,Electrical Engineering,3
Bob Johnson,bob.j@college.edu,2024003,Mechanical Engineering,1
```

### **Alumni CSV Template**
Create a file named `alumni.csv`:

```csv
name,collegeEmail,graduationYear,currentCompany,role,domain,location
Alice Brown,alice.b@college.edu,2020,Google,Software Engineer,Technology,California
David Lee,david.lee@college.edu,2019,Microsoft,Senior Developer,Cloud Computing,Seattle
Emma Wilson,emma.w@college.edu,2021,Amazon,Product Manager,E-Commerce,New York
```

## 🔒 Role-Based Access Summary

| Action | Student | Alumni | Admin |
|--------|---------|--------|-------|
| View Jobs | ✅ | ✅ | ✅ |
| Apply for Jobs | ✅ | ✅ | ✅ |
| Post Jobs | ❌ | ✅ | ✅ |
| Delete Own Jobs | ❌ | ✅ | ✅ |
| Delete Any Jobs | ❌ | ❌ | ✅ |
| Upload CSV | ❌ | ❌ | ✅ |

## 🛠️ Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── jobController.js     # Job CRUD with role restrictions
│   └── csvController.js     # CSV upload & processing
├── middleware/
│   ├── auth.js              # JWT & role-based auth
│   └── upload.js            # Multer file upload config
├── models/
│   ├── User.js              # User schema (student/alumni/admin)
│   └── Job.js               # Job schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── jobRoutes.js         # Job endpoints
│   └── csvRoutes.js         # CSV upload endpoints
├── uploads/
│   └── csv/                 # Temporary CSV storage
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── server.js                # Main application entry
└── README.md
```

## 🧪 Testing with Postman/Thunder Client

### Step 1: Create Admin User
```http
POST http://localhost:5000/api/auth/register
{
  "name": "Admin User",
  "collegeEmail": "admin@college.edu",
  "password": "admin123",
  "role": "admin"
}
```

### Step 2: Login and Get Token
```http
POST http://localhost:5000/api/auth/login
{
  "collegeEmail": "admin@college.edu",
  "password": "admin123"
}
```
Copy the `token` from response.

### Step 3: Upload CSV
```http
POST http://localhost:5000/api/csv/upload-students
Authorization: Bearer <your_token>
Body: form-data
  csvFile: <select students.csv file>
```

### Step 4: Create Alumni User and Post Job
```http
POST http://localhost:5000/api/auth/register
{
  "name": "Alumni User",
  "collegeEmail": "alumni@college.edu",
  "password": "alumni123",
  "role": "alumni",
  "graduationYear": 2020,
  "currentCompany": "Tech Firm",
  "jobRole": "Senior Developer",
  "domain": "Software",
  "location": "Bangalore"
}
```

Then login as alumni and post a job:
```http
POST http://localhost:5000/api/jobs
Authorization: Bearer <alumni_token>
{
  "title": "Backend Developer",
  "company": "StartupXYZ",
  "companyWebsiteURL": "https://startupxyz.com/apply",
  "description": "Join our team!",
  "location": "Remote",
  "jobType": "full-time"
}
```

### Step 5: Test Student Apply (Redirect)
Login as student, then:
```http
GET http://localhost:5000/api/jobs/<job_id>/apply
Authorization: Bearer <student_token>
```
This will redirect to the company's website.

## 📝 Notes

1. **Passwords**: Generated passwords for CSV uploads are logged to console. In production, send them via email.

2. **File Size**: CSV upload is limited to 5MB. Adjust in `middleware/upload.js` if needed.

3. **Security**: Change `JWT_SECRET` in production to a strong random string.

4. **CORS**: Currently allows all origins. Configure properly for production.

5. **Error Handling**: All endpoints return consistent JSON responses with `success` boolean.

## 🐛 Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For MongoDB Atlas, whitelist your IP

### CSV Upload Fails
- Check file format (must be `.csv`)
- Verify all required fields are present
- Ensure you're logged in as admin

### Token Expired
- Login again to get a new token
- Default expiry is 7 days (set in `.env`)

## 📄 License
ISC

---

**Built with ❤️ for Alumni Management System**
