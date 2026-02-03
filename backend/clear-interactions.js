import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MentorshipRequest from './models/MentorshipRequest.js';
import MentorshipChat from './models/MentorshipChat.js';
import Connection from './models/Connection.js';
import ChatMessage from './models/ChatMessage.js';

dotenv.config();

const clearInteractionData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        console.log('🗑️  Clearing interaction data...');
        const mentReqRes = await MentorshipRequest.deleteMany({});
        const mentChatRes = await MentorshipChat.deleteMany({});
        const connRes = await Connection.deleteMany({});
        const chatMsgRes = await ChatMessage.deleteMany({});

        console.log(`✅ Deleted ${mentReqRes.deletedCount} Mentorship Requests.`);
        console.log(`✅ Deleted ${mentChatRes.deletedCount} Mentorship Chats.`);
        console.log(`✅ Deleted ${connRes.deletedCount} Connections.`);
        console.log(`✅ Deleted ${chatMsgRes.deletedCount} Chat Messages.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing interaction data:', error);
        process.exit(1);
    }
};

clearInteractionData();
