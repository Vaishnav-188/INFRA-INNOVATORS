import mongoose from 'mongoose';

const mentorshipChatSchema = new mongoose.Schema({
    mentorshipRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorshipRequest',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
mentorshipChatSchema.index({ mentorshipRequest: 1, createdAt: 1 });
mentorshipChatSchema.index({ sender: 1, receiver: 1 });
mentorshipChatSchema.index({ receiver: 1, read: 1 });

const MentorshipChat = mongoose.model('MentorshipChat', mentorshipChatSchema);

export default MentorshipChat;
