import mongoose from 'mongoose';

const chatbotConversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        intent: {
            type: String,
            enum: [
                'search_alumni',
                'search_jobs',
                'search_events',
                'mentorship_request',
                'donation_info',
                'general_help',
                'greeting',
                'other'
            ]
        },
        entities: {
            domain: [String],
            location: [String],
            skills: [String],
            role: [String],
            company: [String],
            eventType: [String],
            date: [String]
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    context: {
        lastIntent: String,
        lastEntities: mongoose.Schema.Types.Mixed,
        conversationState: {
            type: String,
            enum: ['active', 'waiting_input', 'completed'],
            default: 'active'
        }
    },
    metadata: {
        userRole: String,
        deviceType: String,
        source: {
            type: String,
            default: 'web'
        }
    },
    satisfaction: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String
    },
    resolved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-update lastActivity on message addition
chatbotConversationSchema.pre('save', function (next) {
    this.lastActivity = Date.now();
    next();
});

// Indexes
chatbotConversationSchema.index({ user: 1, sessionId: 1 });
chatbotConversationSchema.index({ lastActivity: -1 });
chatbotConversationSchema.index({ 'messages.intent': 1 });

const ChatbotConversation = mongoose.model('ChatbotConversation', chatbotConversationSchema);

export default ChatbotConversation;
