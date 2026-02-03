import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  File not found: ${filePath}`);
            return resolve([]);
        }
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '')
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

const importData = async () => {
    try {
        await connectDB();

        console.log('🗑️  Clearing existing student and alumni data...');
        // Delete all users except admins
        const deleteResult = await User.deleteMany({ role: { $in: ['student', 'alumni'] } });
        console.log(`✅ Deleted ${deleteResult.deletedCount} existing users.`);

        // 1. Import Alumni from root
        const alumniPath = path.join(__dirname, '..', 'alumni_clean.csv');
        console.log(`📂 Reading alumni from: ${alumniPath}`);
        const alumniData = await parseCSV(alumniPath);
        console.log(`📊 Found ${alumniData.length} alumni records.`);

        for (const row of alumniData) {
            try {
                const skills = row.skills ? row.skills.split(',').map(s => s.trim()) : [];
                const interests = row.interests ? row.interests.split(',').map(i => i.trim()) : [];

                const userData = {
                    name: row.name,
                    username: row.email.split('@')[0],
                    collegeEmail: row.email.toLowerCase().trim(),
                    password: 'Alumni@123', // Default password
                    role: 'alumni',
                    department: row.department,
                    graduationYear: parseInt(row.graduationYear),
                    currentCompany: row.currentCompany,
                    isPlaced: row.currentCompany && row.currentCompany !== 'Not Placed',
                    jobRole: row.jobRole,
                    location: row.location,
                    salary: row.salary ? parseInt(row.salary) : undefined,
                    skills: skills,
                    interests: interests,
                    linkedIn: row.linkedIn,
                    isVerified: true
                };

                await User.create(userData);
            } catch (err) {
                console.error(`❌ Error importing alumni ${row.email}:`, err.message);
            }
        }
        console.log(`✅ Finished importing alumni.`);

        // 2. Import Students from backend/sample-csv
        const studentsPath = path.join(__dirname, 'sample-csv', 'students_clean.csv');
        console.log(`📂 Reading students from: ${studentsPath}`);
        const studentsData = await parseCSV(studentsPath);
        console.log(`📊 Found ${studentsData.length} student records.`);

        for (const row of studentsData) {
            try {
                const projectDomains = row.projectDomains ? row.projectDomains.split(',').map(d => d.trim()) : [];
                const interests = row.interests ? row.interests.split(',').map(i => i.trim()) : [];

                const userData = {
                    name: row.name,
                    username: row.username || row.collegeEmail.split('@')[0],
                    collegeEmail: row.collegeEmail.toLowerCase().trim(),
                    password: row.password || 'Student@123',
                    role: 'student',
                    mobileNumber: row.mobileNumber,
                    rollNumber: row.rollNumber,
                    registerNumber: row.registerNumber,
                    department: row.department,
                    yearOfStudy: parseInt(row.yearOfStudy),
                    batch: row.batch,
                    githubRepo: row.githubRepo,
                    projectDomains: projectDomains,
                    interests: interests,
                    isVerified: true
                };

                await User.create(userData);
            } catch (err) {
                console.error(`❌ Error importing student ${row.collegeEmail}:`, err.message);
            }
        }
        console.log(`✅ Finished importing students.`);

        // 3. Ensure Admins exist
        const admins = [
            {
                name: 'Kite Admin',
                username: 'admin.kite',
                collegeEmail: 'admin@kgkite.ac.in',
                password: 'AdminPassword123',
                role: 'admin',
                isVerified: true
            },
            {
                name: 'College Admin',
                username: 'admin.college',
                collegeEmail: 'admin@college.edu',
                password: 'Admin@123',
                role: 'admin',
                isVerified: true
            }
        ];

        for (const admin of admins) {
            const exists = await User.findOne({ collegeEmail: admin.collegeEmail });
            if (!exists) {
                await User.create(admin);
                console.log(`✅ Created admin: ${admin.collegeEmail}`);
            } else {
                console.log(`ℹ️  Admin already exists: ${admin.collegeEmail}`);
            }
        }

        console.log('\n🎉 Data reset and import complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Critical Error during import:', error);
        process.exit(1);
    }
};

importData();
