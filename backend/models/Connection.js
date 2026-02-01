import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    alumni: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: {
        type: String,
        maxlength: 500
    },
    studentInterests: {
        type: [String],
        default: []
    },
    matchScore: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
connectionSchema.index({ student: 1, alumni: 1 });
connectionSchema.index({ status: 1 });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
