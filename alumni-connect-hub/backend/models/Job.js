import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide job title'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Please provide company name'],
        trim: true
    },
    companyWebsiteURL: {
        type: String,
        required: [true, 'Please provide company website URL for job applications'],
        match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },
    description: {
        type: String,
        required: [true, 'Please provide job description']
    },
    location: {
        type: String,
        required: [true, 'Please provide job location']
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'internship', 'contract'],
        default: 'full-time'
    },
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    experienceRequired: {
        type: String
    },
    skills: [String],
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    deadline: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
