import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    response: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'events', 'jobs', 'connections', 'donations', 'help'],
        default: 'general'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for user chat history
chatMessageSchema.index({ userId: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
