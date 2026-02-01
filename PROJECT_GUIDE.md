# 🎓 Alumni Connect Hub - Complete Project Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Login Credentials](#login-credentials)
6. [How It Works](#how-it-works)
7. [User Roles & Capabilities](#user-roles--capabilities)
8. [API Endpoints](#api-endpoints)
9. [Dependencies](#dependencies)

---

## 🎯 Project Overview

**Alumni Connect Hub** is a comprehensive web-based platform designed to bridge the gap between alumni, current students, and educational institutions. It provides a seamless ecosystem for networking, career development, event management, and fundraising.

### Key Objectives
- Connect alumni with current students for mentorship
- Facilitate job posting and recruitment
- Organize and manage alumni events
- Enable secure donation management with UPI integration
- Provide administrative oversight and analytics

---

## ✨ Features

### For Alumni
- **Profile Management**: Complete profile with education, work experience, and skills
- **Job Posting**: Post job opportunities for students and fellow alumni
- **Event Participation**: Register and participate in alumni events
- **Mentorship**: Connect with students for career guidance
- **Donations**: Contribute to the institution via secure UPI payment gateway
- **Networking**: Connect with other alumni based on batch, department, or interests

### For Students
- **Job Search**: Browse and apply for jobs posted by alumni
- **Mentorship Requests**: Connect with alumni for career guidance
- **Event Access**: Participate in networking and educational events
- **Profile Building**: Create comprehensive profiles for future alumni network

### For Administrators
- **User Verification**: Approve/reject alumni and student registrations
- **Event Management**: Create, edit, and manage events
- **Donation Tracking**: Monitor all contributions and generate reports
- **CSV Data Upload**: Bulk import alumni and student data
- **System Settings**: Configure UPI details, donation messages, and platform settings
- **Analytics Dashboard**: View platform statistics and user engagement

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router DOM** - Client-side routing
- **Tanstack Query** - Server state management
- **Sonner** - Toast notifications
- **Lucide React** - Modern icons
- **GSAP** - Advanced animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **csv-parser** - CSV file processing
- **multer** - File upload handling

### Additional Tools
- **RESTful API** - Standard API architecture
- **CORS** - Cross-origin resource sharing
- **Environment Variables** - Secure configuration

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd alumni-connect-hub
```

### Step 2: Install Frontend Dependencies
```bash
npm install
```

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 4: Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/alumni-management
JWT_SECRET=alumni_management_super_secret_jwt_key_change_in_production_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

### Step 5: Start MongoDB
```bash
# If using local MongoDB
mongod
```

### Step 6: Seed Initial Data (Optional)
```bash
cd backend
node seed.js
```

### Step 7: Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Step 8: Start Frontend Development Server
```bash
# In the root directory
npm run dev
# Application runs on http://localhost:8081
```

---

## 🔐 Login Credentials

### Admin Account
```
Email: admin@university.edu
Password: Admin@2024
Role: Administrator
```

**Admin Capabilities:**
- Verify/reject user registrations
- Manage all events and donations
- Upload CSV data
- Access full analytics
- Configure system settings

### Alumni Account (Demo)
```
Email: john.doe@alumni.university.edu
Password: Alumni@2024
Role: Alumni
Status: Verified
```

**Alumni Capabilities:**
- Post jobs and events
- Make donations
- Connect with students
- Update profile
- View analytics

### Student Account (Demo)
```
Email: jane.smith@university.edu
Password: Student@2024
Role: Student
Status: Pending (needs admin approval)
```

**Student Capabilities:**
- Apply for jobs
- Register for events
- Request mentorship
- Build profile

### Creating New Accounts
1. Navigate to Sign Up page
2. Fill in required details
3. Choose role (Alumni/Student)
4. Wait for admin verification
5. Login after approval

---

## 🎯 How It Works

### 1. User Registration & Authentication
```
User Signs Up → Email Verification → Admin Approval → Account Activated
```

- Users register with college email
- JWT tokens are used for secure authentication
- Role-based access control (RBAC) enforces permissions
- Passwords are hashed using bcrypt

### 2. Job Posting & Application Flow
```
Alumni Posts Job → Students Browse → Student Applies → Alumni Reviews → Connection Made
```

- Alumni create job listings with details (title, company, salary, requirements)
- Students can filter jobs by location, skills, salary
- Application tracking with status updates
- Direct messaging between recruiter and applicant

### 3. Event Management System
```
Admin/Alumni Creates Event → Participants Register → Event Occurs → Feedback Collection
```

- Events can be virtual or in-person
- Category tags (Networking, Workshop, Conference, Social)
- Participant tracking and attendance management
- Image upload for event promotion

### 4. Donation Processing
```
Step 1: Alumni Enters Amount → QR Code Generated with Amount
Step 2: Alumni Scans & Pays via UPI → Enters Transaction ID
Step 3: System Verifies → Payment Recorded → Dashboard Updated
```

**Donation Flow Details:**
1. **Amount Entry**: Alumni enters donation amount
2. **Dynamic QR Generation**: QR code with pre-filled amount using UPI deep linking
3. **Payment Confirmation**: User scans QR, pays via Google Pay/PhonePe/Paytm
4. **Verification**: User enters 12-digit Transaction ID (UTR)
5. **Bank Sync Simulation**: System validates transaction
6. **Success**: Payment recorded, dashboard updated, admin notified

### 5. Admin Dashboard Workflow
```
Monitor Verifications → Review Donations → Manage Events → Upload Data → Configure Settings
```

- Real-time notifications for new donations
- CSV bulk upload for alumni/student data
- System-wide settings management (UPI ID, messages)
- Analytics and reporting

---

## 👥 User Roles & Capabilities

### 🔴 Administrator
| Feature | Access Level |
|---------|-------------|
| User Verification | Full Control |
| Event Management | Create/Edit/Delete All |
| Job Postings | View All |
| Donations | View All + Analytics |
| CSV Upload | Bulk Import Users |
| System Settings | Full Configuration |

### 🔵 Alumni
| Feature | Access Level |
|---------|-------------|
| Profile | Edit Own |
| Job Posting | Create/Edit Own |
| Event Creation | Create/Edit Own |
| Donations | Make Contributions |
| Connections | Network with All |
| Mentorship | Offer Guidance |

### 🟢 Student
| Feature | Access Level |
|---------|-------------|
| Profile | Edit Own |
| Job Applications | Apply to All |
| Event Registration | Join All |
| Donations | Not Applicable |
| Connections | Request from Alumni |
| Mentorship | Request Guidance |

---

## 📡 API Endpoints

### Authentication
```http
POST   /api/auth/signup          # Register new user
POST   /api/auth/signin          # User login
GET    /api/auth/profile         # Get current user profile
PATCH  /api/auth/profile         # Update profile
```

### Users
```http
GET    /api/users               # Get all users (Admin only)
GET    /api/users/stats         # Get user statistics
PATCH  /api/users/:id/verify    # Verify user (Admin only)
```

### Jobs
```http
GET    /api/jobs                # Get all jobs
GET    /api/jobs/:id            # Get single job
POST   /api/jobs                # Create job (Alumni only)
DELETE /api/jobs/:id            # Delete job (Owner/Admin)
POST   /api/jobs/:id/apply      # Apply for job (Student only)
```

### Events
```http
GET    /api/events              # Get all events
GET    /api/events/my           # Get user's events
POST   /api/events              # Create event (Alumni/Admin)
PATCH  /api/events/:id          # Update event (Owner/Admin)
DELETE /api/events/:id          # Delete event (Owner/Admin)
```

### Donations
```http
GET    /api/donations           # Get all donations (Admin)
GET    /api/donations/my        # Get user's donations
POST   /api/donations           # Create donation (Alumni only)
```

### System
```http
GET    /api/system/settings     # Get system settings
PATCH  /api/system/settings     # Update settings (Admin only)
GET    /health                  # Server health check
```

### CSV Upload
```http
POST   /api/csv/upload-students # Upload students CSV (Admin)
POST   /api/csv/upload-alumni   # Upload alumni CSV (Admin)
```

---

## 📦 Dependencies

### Frontend Dependencies
```json
{
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-select": "^2.1.2",
  "@radix-ui/react-slot": "^1.1.1",
  "@tanstack/react-query": "^5.62.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "gsap": "^3.12.5",
  "lucide-react": "^0.469.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^7.1.3",
  "sonner": "^1.7.3",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7"
}
```

### Backend Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "csv-parser": "^3.0.0",
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.9.3",
  "multer": "^1.4.5-lts.1"
}
```

### Dev Dependencies
```json
{
  "@eslint/js": "^9.17.0",
  "@types/node": "^22.10.5",
  "@types/react": "^19.0.6",
  "@types/react-dom": "^19.0.2",
  "@vitejs/plugin-react-swc": "^3.5.0",
  "autoprefixer": "^10.4.20",
  "eslint": "^9.17.0",
  "globals": "^15.14.0",
  "nodemon": "^3.1.9",
  "postcss": "^8.5.1",
  "tailwindcss": "^3.4.17",
  "typescript": "~5.7.2",
  "typescript-eslint": "^8.18.2",
  "vite": "^6.0.5"
}
```

---

## 🎨 Design Features

### Responsive Design
- **Mobile-First Approach**: Optimized for phones, tablets, and desktops
- **Safe Area Support**: Handles device notches (iPhone X+, Android punch-holes)
- **Touch Optimization**: 44px minimum touch targets for mobile
- **Adaptive Typography**: 14px mobile → 16px desktop

### Visual Design
- **Glassmorphism UI**: Modern frosted glass effects
- **Dark/Light Theme**: Automatic theme detection
- **Smooth Animations**: GSAP-powered transitions
- **Custom Scrollbars**: Branded scrollbar styling
- **Brand Colors**: Professional blue (#3b82f6) with complementary palette

### Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG AA compliant

---

## 📊 Database Schema

### Users Collection
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: ['student', 'alumni', 'admin'],
  isVerified: Boolean,
  profile: {
    name: String,
    bio: String,
    graduationYear: Number,
    department: String,
    currentCompany: String,
    currentPosition: String,
    location: String,
    phone: String,
    linkedin: String,
    skills: [String]
  },
  createdAt: Date,
  lastLogin: Date
}
```

### Jobs Collection
```javascript
{
  title: String,
  company: String,
  description: String,
  requirements: String,
  location: String,
  type: ['full-time', 'part-time', 'contract', 'internship'],
  salary: String,
  skills: [String],
  postedBy: ObjectId (User),
  applications: [{
    applicant: ObjectId (User),
    appliedAt: Date,
    status: ['pending', 'reviewed', 'accepted', 'rejected']
  }],
  status: ['active', 'closed'],
  createdAt: Date
}
```

### Events Collection
```javascript
{
  title: String,
  description: String,
  eventType: ['webinar', 'workshop', 'conference', 'networking', 'social'],
  date: Date,
  venue: String,
  isVirtual: Boolean,
  meetingLink: String,
  organizer: ObjectId (User),
  participants: [{
    user: ObjectId (User),
    registeredAt: Date,
    attended: Boolean
  }],
  maxParticipants: Number,
  imageUrl: String,
  createdAt: Date
}
```

### Donations Collection
```javascript
{
  donor: ObjectId (User),
  amount: Number,
  purpose: String,
  transactionId: String (unique),
  paymentStatus: ['pending', 'completed', 'failed'],
  message: String,
  createdAt: Date
}
```

---

## 🔒 Security Features

1. **Password Encryption**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-Based Access Control**: Middleware-enforced permissions
4. **Input Validation**: Server-side validation for all inputs
5. **CORS Protection**: Configured for specific origins
6. **Environment Variables**: Sensitive data in .env files
7. **SQL Injection Prevention**: Mongoose parameterized queries
8. **XSS Protection**: Input sanitization

---

## 📱 Mobile Features

- **PWA Support**: Can be installed on home screen
- **Offline Mode**: Service worker for basic offline functionality
- **Touch Gestures**: Swipe navigation support
- **Mobile Optimized Forms**: Large touch targets
- **Responsive Images**: Optimized for different screen sizes
- **Mobile Menu**: Hamburger navigation for small screens

---

## 🎓 Presentation Highlights

### For Your Presentation, Emphasize:

1. **Problem Statement**
   - Alumni networks are often fragmented
   - Students lack direct access to successful alumni
   - Traditional reunion methods are outdated

2. **Solution**
   - Centralized platform for all alumni activities
   - Direct mentorship and job opportunities
   - Modern, mobile-friendly interface

3. **Innovation**
   - UPI integration for donations with QR codes
   - Real-time verification system
   - Role-based dashboards
   - CSV bulk upload for legacy data

4. **Impact**
   - Strengthened alumni-institution bonds
   - Increased student career opportunities
   - Streamlined fundraising process
   - Data-driven decision making

5. **Scalability**
   - Cloud-ready architecture
   - Database indexing for performance
   - RESTful API for future integrations
   - Mobile-first responsive design

---

## 🚀 Future Enhancements

- Real-time chat between alumni and students
- Video conferencing integration
- Advanced matching algorithms for mentorship
- Payment gateway integration (Razorpay/Stripe)
- Email notification system
- Mobile native apps (React Native)
- Alumni directory with advanced search
- Success stories and testimonials section

---

## 📞 Support & Maintenance

### For Issues:
1. Check console logs (F12 in browser)
2. Verify MongoDB connection
3. Ensure both servers are running
4. Check .env configuration
5. Clear browser cache and cookies

### Server URLs:
- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 📄 License

This project is developed for educational purposes as part of the Alumni Management System initiative.

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for educational institutions
- Focused on user experience and security
- Optimized for performance and scalability

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

---

## Quick Start Commands

```bash
# Start MongoDB
mongod

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev

# Access Application
http://localhost:8081
```

**Login as Admin**: admin@university.edu / Admin@2024  
**Explore the platform and showcase all features!** 🎉
