import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event.js';
import Job from './models/Job.js';

dotenv.config();

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        console.log('🗑️  Clearing Events and Jobs...');
        const eventRes = await Event.deleteMany({});
        const jobRes = await Job.deleteMany({});

        console.log(`✅ Deleted ${eventRes.deletedCount} Events.`);
        console.log(`✅ Deleted ${jobRes.deletedCount} Jobs.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
