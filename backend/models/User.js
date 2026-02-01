import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  collegeEmail: {
    type: String,
    required: [true, 'Please provide college email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    validate: {
      validator: function (email) {
        // Students must use @kgkite.ac.in email
        if (this.role === 'student') {
          return email.toLowerCase().endsWith('@kgkite.ac.in');
        }
        return true;
      },
      message: 'Students must use @kgkite.ac.in email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin'],
    default: 'student'
  },

  // Common fields
  username: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  mobileNumber: {
    type: String,
    sparse: true
  },

  // Student-specific fields
  rollNumber: {
    type: String,
    sparse: true
  },
  registerNumber: {
    type: String,
    sparse: true
  },
  department: {
    type: String
  },
  yearOfStudy: {
    type: Number
  },
  batch: {
    type: String // e.g., "2021-2025"
  },
  githubRepo: {
    type: String
  },
  projectDomains: {
    type: [String], // e.g., ['AI', 'Web Development', 'ML']
    default: []
  },
  mentorDomainPreference: {
    type: String
  },

  // Alumni-specific fields
  graduationYear: {
    type: Number
  },
  studyPeriod: {
    type: String // e.g., "2020-2024"
  },
  currentCompany: {
    type: String,
    default: 'Not Placed'
  },
  isPlaced: {
    type: Boolean,
    default: false
  },
  jobRole: {
    type: String
  },
  domain: {
    type: String
  },
  location: {
    type: String
  },
  salary: {
    type: Number // For ranking highly placed alumni
  },

  // Skills and interests for matching
  skills: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    maxlength: 500
  },
  linkedIn: {
    type: String
  },
  github: {
    type: String
  },
  portfolio: {
    type: String
  },
  isAvailableForMentorship: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: function () {
      // Students and Admins must be verified by an admin
      return this.role === 'alumni';
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
