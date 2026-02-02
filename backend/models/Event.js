import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide event title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide event description']
    },
    eventType: {
        type: String,
        enum: ['webinar', 'workshop', 'conference', 'networking', 'social', 'other'],
        default: 'networking'
    },
    date: {
        type: Date,
        required: [true, 'Please provide event date']
    },
    endDate: {
        type: Date
    },
    venue: {
        type: String,
        required: true
    },
    isVirtual: {
        type: Boolean,
        default: false
    },
    meetingLink: {
        type: String
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        attended: {
            type: Boolean,
            default: false
        }
    }],
    maxParticipants: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    tags: [{
        type: String
    }],
    imageUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizer: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
