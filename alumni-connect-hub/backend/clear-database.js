import mongoose from 'mongoose';
import User from './models/User.js';
import PreVerifiedStudent from './models/PreVerifiedStudent.js';
import dotenv from 'dotenv';

dotenv.config();

const clearDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database...');

        // Delete ONLY students and alumni (PRESERVE ADMIN ACCOUNTS)
        const userResult = await User.deleteMany({
            role: { $in: ['student', 'alumni'] }
        });
        console.log(`✅ Deleted ${userResult.deletedCount} users (students & alumni)`);

        // Count remaining admins
        const adminCount = await User.countDocuments({ role: 'admin' });
        console.log(`✅ Preserved ${adminCount} admin account(s)`);

        // Delete all pre-verified students
        const preVerifiedResult = await PreVerifiedStudent.deleteMany({});
        console.log(`✅ Deleted ${preVerifiedResult.deletedCount} pre-verified students`);

        console.log('\n✅ Database cleared successfully!');
        console.log('Admin accounts are safe. You can now upload fresh CSV files.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
};

clearDatabase();
