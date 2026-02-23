import mongoose from 'mongoose';

const mentorshipRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    alumni: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    domain: {
        type: String,
        required: [true, 'Please specify the domain of interest']
    },
    skills: [{
        type: String
    }],
    message: {
        type: String,
        required: [true, 'Please provide a message'],
        maxlength: 1000
    },
    careerGoals: {
        type: String,
        maxlength: 500
    },
    preferredMode: {
        type: String,
        enum: ['online', 'offline', 'both'],
        default: 'online'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    autoSuggested: {
        type: Boolean,
        default: false
    },
    approvedByAdmin: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    sessions: [{
        scheduledAt: Date,
        duration: Number,
        notes: String,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    feedback: {
        studentRating: {
            type: Number,
            min: 1,
            max: 5
        },
        alumniRating: {
            type: Number,
            min: 1,
            max: 5
        },
        studentComment: String,
        alumniComment: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
mentorshipRequestSchema.index({ student: 1, status: 1 });
mentorshipRequestSchema.index({ alumni: 1, status: 1 });
mentorshipRequestSchema.index({ domain: 1 });
mentorshipRequestSchema.index({ matchScore: -1 });

const MentorshipRequest = mongoose.model('MentorshipRequest', mentorshipRequestSchema);

export default MentorshipRequest;
