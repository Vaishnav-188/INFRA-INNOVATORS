import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedStudentsFromCSV = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for student seeding...');

        const csvPath = path.join(__dirname, 'sample-csv', 'students_clean.csv');
        if (!fs.existsSync(csvPath)) {
            console.error(`CSV file not found at ${csvPath}`);
            process.exit(1);
        }

        const results = [];
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Processing ${results.length} student records...`);

                for (const row of results) {
                    const email = row.collegeEmail || row.email || row.college_email;
                    if (!email) continue;

                    const userData = {
                        name: row.name,
                        username: row.username,
                        collegeEmail: email.toLowerCase().trim(),
                        password: 'Student@111', // Let's use Student@123 but maybe they want Student@111? No, UI says Student@123
                        role: 'student',
                        isVerified: true,
                        mobileNumber: row.mobileNumber,
                        rollNumber: row.rollNumber,
                        registerNumber: row.registerNumber,
                        department: row.department,
                        yearOfStudy: parseInt(row.yearOfStudy),
                        batch: row.batch,
                        githubRepo: row.githubRepo,
                        projectDomains: row.projectDomains ? row.projectDomains.split(',').map(s => s.trim()) : [],
                        interests: row.interests ? row.interests.split(',').map(i => i.trim()) : []
                    };

                    // Force Student@123 to match UI demo box
                    userData.password = 'Student@123';

                    const existing = await User.findOne({ collegeEmail: userData.collegeEmail });
                    if (existing) {
                        existing.password = userData.password;
                        Object.assign(existing, userData);
                        await existing.save();
                    } else {
                        await User.create(userData);
                    }
                }

                console.log('✅ Students seeded successfully from CSV!');
                process.exit(0);
            });
    } catch (error) {
        console.error('❌ Student seeding failed:', error);
        process.exit(1);
    }
};

seedStudentsFromCSV();
