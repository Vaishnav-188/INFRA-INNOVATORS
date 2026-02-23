import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const verifySeed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'arjun.mehta@kgkite.alumni.ac.in';
        const user = await User.findOne({ collegeEmail: email });

        if (user) {
            console.log(`VERIFIED: User ${email} found!`);
            console.log(`Role: ${user.role}, Verified: ${user.isVerified}`);
        } else {
            console.log(`FAILED: User ${email} not found.`);
            const anyAlumni = await User.findOne({ role: 'alumni' });
            if (anyAlumni) {
                console.log(`Sample alumni found: ${anyAlumni.collegeEmail}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verifySeed();
