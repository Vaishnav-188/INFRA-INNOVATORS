import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkLastAlumni = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const alumni = await User.find({ role: 'alumni' }).sort({ createdAt: 1 });
        console.log(`Total Alumni found: ${alumni.length}`);

        alumni.forEach((a, i) => {
            console.log(`${i + 1}: ${a.name} (${a.collegeEmail})`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkLastAlumni();
