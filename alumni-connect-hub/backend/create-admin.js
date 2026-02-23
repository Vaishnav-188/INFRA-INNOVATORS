import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MANUAL ADMIN CREATION SCRIPT
 * 
 * This script creates admin accounts in MongoDB.
 * Admins are NEVER deleted by clear-database.js
 */

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define admin accounts to create
        const admins = [
            {
                name: 'System Administrator',
                collegeEmail: 'admin@college.edu',
                password: 'Admin@123',
                role: 'admin',
                isVerified: true,
                passwordInitialized: true, // Admin password is pre-set
                username: 'admin'
            },
            // Add more admins here if needed
            // {
            //     name: 'John Doe',
            //     collegeEmail: 'john.admin@college.edu',
            //     password: 'SecurePass@123',
            //     role: 'admin',
            //     isVerified: true,
            //     passwordInitialized: true,
            //     username: 'john.admin'
            // }
        ];

        console.log(`\nCreating ${admins.length} admin account(s)...\n`);

        for (const adminData of admins) {
            // Check if admin already exists
            const existing = await User.findOne({ collegeEmail: adminData.collegeEmail });

            if (existing) {
                if (existing.role === 'admin') {
                    console.log(`⚠️  Admin already exists: ${adminData.collegeEmail}`);
                    console.log(`   Updating password to: ${adminData.password}`);

                    // Update existing admin
                    existing.password = adminData.password;
                    existing.passwordInitialized = true;
                    existing.isVerified = true;
                    Object.assign(existing, adminData);
                    await existing.save();

                    console.log(`✅ Admin updated: ${adminData.collegeEmail}\n`);
                } else {
                    console.log(`❌ Email ${adminData.collegeEmail} exists but is not an admin (role: ${existing.role})`);
                    console.log(`   Skipping...\n`);
                }
            } else {
                // Create new admin
                const newAdmin = await User.create(adminData);
                console.log(`✅ Admin created successfully!`);
                console.log(`   Email: ${adminData.collegeEmail}`);
                console.log(`   Password: ${adminData.password}`);
                console.log(`   Name: ${adminData.name}\n`);
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ADMIN SETUP COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Display login credentials
        console.log('🔐 ADMIN LOGIN CREDENTIALS:\n');
        for (const admin of admins) {
            console.log(`   Email: ${admin.collegeEmail}`);
            console.log(`   Password: ${admin.password}`);
            console.log(`   URL: http://localhost:3000/signin\n`);
        }

        console.log('⚠️  SECURITY NOTE:');
        console.log('   - Admin accounts are protected from clear-database.js');
        console.log('   - Change default password after first login');
        console.log('   - Store credentials securely\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
