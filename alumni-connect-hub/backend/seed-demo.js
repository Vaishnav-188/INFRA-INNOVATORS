import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedDemoUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for seeding...');

        const demoUsers = [
            {
                name: 'System Admin',
                collegeEmail: 'admin@college.edu',
                password: 'Admin@123',
                role: 'admin',
                isVerified: true,
                username: 'admin'
            },
            {
                name: 'Student One',
                collegeEmail: 'student1@kgkite.ac.in',
                password: 'Student@123',
                role: 'student',
                isVerified: true,
                username: 'student1',
                batch: '2022-2026',
                department: 'Computer Science'
            },
            {
                name: 'Arjun Das',
                collegeEmail: 'arjun.das@kgkite.alumni.ac.in',
                password: 'Alumni@123',
                role: 'alumni',
                isVerified: true,
                username: 'arjun.das',
                currentCompany: 'Google',
                jobRole: 'Software Engineer',
                graduationYear: 2020
            },
            {
                name: 'Aarav Kumar',
                collegeEmail: 'aarav.kumar@kgkite.ac.in',
                password: 'Student@123',
                role: 'student',
                isVerified: true,
                username: 'aarav01',
                batch: '2022-2026',
                department: 'Computer Science'
            }
        ];

        for (const userData of demoUsers) {
            const { password, ...otherData } = userData;

            // Check if user exists
            let user = await User.findOne({ collegeEmail: userData.collegeEmail });

            if (user) {
                console.log(`Updating existing user: ${userData.collegeEmail}`);
                user.password = password; // Will be hashed by pre-save hook
                Object.assign(user, otherData);
                await user.save();
            } else {
                console.log(`Creating new demo user: ${userData.collegeEmail}`);
                await User.create(userData);
            }
        }

        console.log('✅ Demo users seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDemoUsers();
