import ChatMessage from '../models/ChatMessage.js';

// Simple chatbot responses
const chatbotResponses = {
    greetings: [
        "Hello! I'm your Alumni Connect Hub assistant. How can I help you today?",
        "Hi there! Need help navigating the platform?",
        "Welcome! I'm here to assist you with events, jobs, connections, and more!"
    ],
    events: [
        "You can find upcoming alumni events on the Events page. Would you like me to show you the latest events?",
        "We have various networking events, workshops, and reunions. Check out the Events section for more details!",
        "Alumni events are a great way to connect! Visit the Events page to see what's coming up."
    ],
    jobs: [
        "Looking for opportunities? Check out our Jobs section where alumni post openings!",
        "Alumni frequently share job opportunities. Head to the Jobs page to see current listings.",
        "Career opportunities from our alumni network are available on the Jobs page!"
    ],
    connections: [
        "You can connect with alumni based on your interests! Go to the Alumni Matching page to find mentors in your field.",
        "Our matching system connects students with alumni who share similar interests and work in relevant domains.",
        "To connect with alumni, visit the Connections page and search for mentors in your area of interest!"
    ],
    donations: [
        "You can support various causes through our Donations page. Every contribution helps!",
        "Alumni can contribute to student scholarships, infrastructure, and other initiatives via the Donations section.",
        "Thank you for considering a donation! Visit the Donations page to see current campaigns."
    ],
    help: [
        "I can help you with: Events, Jobs, Alumni Connections, Donations, and general navigation. What would you like to know?",
        "Here's what I can assist with:\n- Finding events\n- Job opportunities\n- Connecting with alumni\n- Making donations\n- General platform help",
        "Feel free to ask me about events, jobs, alumni connections, or how to use any feature!"
    ],
    default: [
        "I'm not sure I understand that question. Could you try rephrasing it?",
        "Hmm, I can help you with events, jobs, connections, donations, and platform navigation. What would you like to know?",
        "I didn't quite get that. Try asking about events, jobs, alumni connections, or donations!",
        "I'm here to help! Ask me about events, job opportunities, connecting with alumni, or making donations."
    ]
};

// Categorize and respond to messages
const generateResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
        return {
            category: 'general',
            response: chatbotResponses.greetings[Math.floor(Math.random() * chatbotResponses.greetings.length)]
        };
    }

    // Events
    if (lowerMessage.match(/\b(event|workshop|reunion|seminar|conference)\b/)) {
        return {
            category: 'events',
            response: chatbotResponses.events[Math.floor(Math.random() * chatbotResponses.events.length)]
        };
    }

    // Jobs
    if (lowerMessage.match(/\b(job|career|opportunity|hiring|position|work)\b/)) {
        return {
            category: 'jobs',
            response: chatbotResponses.jobs[Math.floor(Math.random() * chatbotResponses.jobs.length)]
        };
    }

    // Connections
    if (lowerMessage.match(/\b(connect|mentor|alumni|network|match|guidance)\b/)) {
        return {
            category: 'connections',
            response: chatbotResponses.connections[Math.floor(Math.random() * chatbotResponses.connections.length)]
        };
    }

    // Donations
    if (lowerMessage.match(/\b(donate|donation|contribute|fund|support|scholarship)\b/)) {
        return {
            category: 'donations',
            response: chatbotResponses.donations[Math.floor(Math.random() * chatbotResponses.donations.length)]
        };
    }

    // Help
    if (lowerMessage.match(/\b(help|assist|guide|how|what|support)\b/)) {
        return {
            category: 'help',
            response: chatbotResponses.help[Math.floor(Math.random() * chatbotResponses.help.length)]
        };
    }

    // Default
    return {
        category: 'general',
        response: chatbotResponses.default[Math.floor(Math.random() * chatbotResponses.default.length)]
    };
};

// Send message to chatbot
export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Generate response
        const { category, response } = generateResponse(message);

        // Save chat message
        const chatMessage = await ChatMessage.create({
            userId,
            message: message.trim(),
            response,
            category
        });

        res.json({
            success: true,
            message: chatMessage.message,
            response: chatMessage.response,
            category: chatMessage.category,
            timestamp: chatMessage.createdAt
        });
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50 } = req.query;

        const chatHistory = await ChatMessage.find({ userId })
            .sort('-createdAt')
            .limit(parseInt(limit));

        res.json({
            success: true,
            chatHistory: chatHistory.reverse() // Oldest first
        });
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Clear chat history
export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        await ChatMessage.deleteMany({ userId });

        res.json({
            success: true,
            message: 'Chat history cleared'
        });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
