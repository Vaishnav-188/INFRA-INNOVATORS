import mongoose from 'mongoose';

const resumeApplicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resumePath: {
        type: String,  // path to uploaded PDF
        required: true
    },
    resumeText: {
        type: String,  // extracted text from PDF for AI screening
        default: ''
    },
    studentSkills: {
        type: [String],
        default: []
    },
    experience: {
        type: String,
        enum: ['Fresher', '0-1 yrs', '1-2 yrs', '2+ yrs'],
        default: 'Fresher'
    },
    projects: {
        type: String,
        default: ''
    },
    aiScore: {
        type: Number,
        default: null
    },
    aiSummary: {
        type: String,
        default: ''
    },
    matchedSkills: {
        type: [String],
        default: []
    },
    missingSkills: {
        type: [String],
        default: []
    },
    suggestions: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'screening', 'shortlisted', 'rejected'],
        default: 'pending'
    },
    interviewDate: {
        type: Date,
        default: null
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    screened: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// One application per (job, student)
resumeApplicationSchema.index({ job: 1, student: 1 }, { unique: true });

const ResumeApplication = mongoose.model('ResumeApplication', resumeApplicationSchema);
export default ResumeApplication;
