# Alumni Connect Hub - Features Documentation

## 🎯 Overview

Alumni Connect Hub is a comprehensive platform that connects students with alumni mentors based on shared interests, skills, and career domains. The platform includes an intelligent matching system and an AI-powered chat assistant to help users navigate the platform.

## ✨ Key Features

### 1. 🤝 Alumni-Student Matching System

**For Students:**
- Search for alumni mentors based on interests (e.g., AI/ML, Web Development, Data Science)
- View match scores that indicate how well an alumni aligns with your interests
- See detailed alumni profiles including:
  - Current company and job role
  - Domain expertise
  - Skills and interests
  - Location
  - Social links (LinkedIn, GitHub, Portfolio)
- Send personalized connection requests with custom messages
- Track connection status (Pending, Accepted, Rejected)

**For Alumni:**
- Receive connection requests from interested students
- View student profiles with their interests and departments
- Accept or reject connection requests
- Manage mentorship availability

### 2. 📊 Connections Management

- **Dashboard** with statistics:
  - Total connections
  - Pending requests
  - Accepted connections
  - Rejected requests
- **Tabbed Interface** to filter by connection status
- **Real-time Updates** when connections are accepted/rejected
- **Detailed Connection Cards** showing all relevant information

### 3.🤖 AI Chat Assistant

- **Floating Chat Button** accessible from anywhere in the platform
- **Intelligent Responses** for:
  - Events and workshops
  - Job opportunities
  - Alumni connections and mentorship
  - Donations and contributions
  - General platform navigation
- **Chat History** saved and loadable across sessions
- **Clear History** option for privacy
- **Modern UI** with smooth animations and typing indicators

## 🚀 Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Make sure your `.env` file has the required variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000` with the following endpoints:
- `/api/auth` - Authentication
- `/api/jobs` - Job postings
- `/api/csv` - CSV import/export
- `/api/connections` - Alumni-student connections
- `/api/chat` - AI chatbot

### Frontend Setup

1. Navigate to the project root:
```bash
cd alumni-connect-hub
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📱 User Guide

### For Students

#### Finding a Mentor

1. **Login** to your student account
2. Click on **"Find Mentors"** in the navigation bar
3. Enter your interests in the search box (e.g., "AI/ML, Machine Learning, Python")
4. Click **"Search"** to find matching alumni
5. View alumni profiles sorted by match score
6. Click **"Connect"** on an alumni card
7. Write a personalized message explaining why you'd like to connect
8. Click **"Send Request"**

#### Managing Connections

1. Click on **"Connections"** in the navigation bar
2. View your connection statistics at the top
3. Use tabs to filter:
   - **All** - See all connections
   - **Pending** - Requests waiting for alumni response
   - **Accepted** - Successful connections
   - **Rejected** - Declined requests
4. View detailed information for each connection

### For Alumni

#### Managing Connection Requests

1. **Login** to your alumni account
2. Click on **"Connections"** in the navigation bar
3. View pending requests from students
4. Read student messages and interests
5. Click **"Accept"** or **"Reject"** based on your availability

#### Updating Your Profile

Make sure to update your profile with:
- Current company and job role
- Domain expertise
- Skills (this helps with matching)
- Interests
- Social links (LinkedIn, GitHub, Portfolio)
- Set `isAvailableForMentorship` to true to appear in student searches

### Using the AI Chat Assistant

1. Click the **floating chat button** (purple circle with message icon) at the bottom-right
2. Type your question or message
3. Get instant responses about:
   - **Events**: "Tell me about upcoming events"
   - **Jobs**: "Show me job opportunities"  
   - **Connections**: "How do I connect with alumni?"
   - **Donations**: "How can I donate?"
   - **Help**: "What can you help me with?"
4. View your chat history
5. Clear history anytime for privacy

## 🎨 Matching Algorithm

The system calculates match scores based on:

- **Skills Match** (10 points per matching skill)
- **Domain Match** (20 points for exact domain match)
- **Interests Match** (5 points per matching interest)

Alumni are sorted by match score (highest first) to show the best mentors for each student.

## 🔧 API Endpoints

### Connections API

```
GET    /api/connections/match?interests=AI,ML
       Get matching alumni for student

POST   /api/connections
       Create a new connection request
       Body: { alumniId, message, interests }

GET    /api/connections?status=pending
       Get all connections (filtered by status)

GET    /api/connections/stats
       Get connection statistics

PATCH  /api/connections/:connectionId/status
       Update connection status (alumni only)
       Body: { status: 'accepted' | 'rejected' }
```

### Chat API

```
POST   /api/chat/message
       Send message to chatbot
       Body: { message }

GET    /api/chat/history?limit=50
       Get chat history

DELETE /api/chat/history
       Clear chat history
```

## 📦 Database Models

### Connection Model
```javascript
{
  student: ObjectId,
  alumni: ObjectId,
  status: 'pending' | 'accepted' | 'rejected',
  message: String,
  studentInterests: [String],
  matchScore: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### ChatMessage Model
```javascript
{
  userId: ObjectId,
  message: String,
  response: String,
  category: 'general' | 'events' | 'jobs' | 'connections' | 'donations' | 'help',
  createdAt: Date
}
```

### Updated User Model
```javascript
{
  // ... existing fields ...
  skills: [String],
  interests: [String],
  bio: String,
  linkedIn: String,
  github: String,
  portfolio: String,
  isAvailableForMentorship: Boolean
}
```

## 🎯 Future Enhancements

- [ ] Direct messaging between connected students and alumni
- [ ] Video call integration for mentorship sessions
- [ ] Calendar integration for scheduling meetings
- [ ] Advanced filtering (by location, company, graduation year)
- [ ] Recommendation system based on successful connections
- [ ] Mobile app version
- [ ] Email notifications for connection requests
- [ ] Alumni testimonials and ratings

## 🐛 Troubleshooting

### Chat Assistant not appearing
- Make sure you're logged in
- Check browser console for errors
- Clear cache and reload

### Matching not working
- Ensure you're logged in as a student
- Check backend is running on port 5000
- Verify MongoDB connection

### Connection requests failing
- Check network tab for API errors
- Verify JWT token is valid
- Ensure alumni exists and is available for mentorship

## 📞 Support

For issues or questions, please check:
1. Backend console logs
2. Browser developer console
3. Network tab for failed requests
4. MongoDB connection status

---

**Built with ❤️ using:**
- React + TypeScript
- Node.js + Express
- MongoDB + Mongoose
- Tailwind CSS + shadcn/ui
- Lucide Icons
