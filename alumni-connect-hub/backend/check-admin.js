import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all admin accounts
        const admins = await User.find({ role: 'admin' }).select('-password');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 ADMIN ACCOUNTS IN DATABASE: ${admins.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (admins.length === 0) {
            console.log('❌ No admin accounts found!');
            console.log('   Run: node create-admin.js\n');
        } else {
            admins.forEach((admin, index) => {
                console.log(`Admin #${index + 1}:`);
                console.log(`  Name: ${admin.name}`);
                console.log(`  Email: ${admin.collegeEmail}`);
                console.log(`  Username: ${admin.username || 'N/A'}`);
                console.log(`  Verified: ${admin.isVerified ? '✅ Yes' : '❌ No'}`);
                console.log(`  Password Set: ${admin.passwordInitialized ? '✅ Yes' : '❌ No'}`);
                console.log(`  Created: ${admin.createdAt}\n`);
            });
        }

        // Count other user types
        const studentCount = await User.countDocuments({ role: 'student' });
        const alumniCount = await User.countDocuments({ role: 'alumni' });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 DATABASE SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  Admins: ${admins.length}`);
        console.log(`  Students: ${studentCount}`);
        console.log(`  Alumni: ${alumniCount}`);
        console.log(`  Total: ${admins.length + studentCount + alumniCount}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkAdmin();
