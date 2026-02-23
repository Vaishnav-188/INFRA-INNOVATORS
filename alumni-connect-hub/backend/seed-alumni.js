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

const seedAlumniFromCSV = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for alumni seeding...');

        const csvPath = path.join(__dirname, 'sample-csv', 'alumni_clean.csv');
        if (!fs.existsSync(csvPath)) {
            console.error(`CSV file not found at ${csvPath}`);
            process.exit(1);
        }

        const results = [];
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`Processing ${results.length} alumni records...`);

                for (const row of results) {
                    let email = row.collegeEmail || row.email || row.college_email;
                    if (!email) continue;

                    email = email.toLowerCase().trim();

                    // Replace @kgkite.ac.in with @kgkite.alumni.ac.in as per user request
                    if (email.endsWith('@kgkite.ac.in')) {
                        email = email.replace('@kgkite.ac.in', '@kgkite.alumni.ac.in');
                    }

                    const userData = {
                        name: row.name,
                        username: row.username,
                        collegeEmail: email,
                        password: row.password || 'Alumni@123',
                        role: 'alumni',
                        isVerified: true,
                        mobileNumber: row.mobileNumber,
                        department: row.department,
                        graduationYear: row.graduationYear ? parseInt(row.graduationYear) : undefined,
                        studyPeriod: row.studyPeriod,
                        currentCompany: row.currentCompany || 'Not Placed',
                        isPlaced: row.isPlaced === 'true',
                        jobRole: row.jobRole,
                        domain: row.domain,
                        location: row.location,
                        salary: row.salary ? parseInt(row.salary) : 0,
                        skills: row.skills ? row.skills.split(',').map(s => s.trim()) : [],
                        interests: row.interests ? row.interests.split(',').map(i => i.trim()) : [],
                        linkedIn: row.linkedIn,
                        github: row.github,
                        bio: row.bio
                    };

                    // Check if user already exists
                    const existing = await User.findOne({ collegeEmail: userData.collegeEmail });
                    if (existing) {
                        existing.password = userData.password;
                        Object.assign(existing, userData);
                        await existing.save();
                    } else {
                        await User.create(userData);
                    }
                }

                console.log('✅ Alumni seeded successfully from CSV with @kgkite.alumni.ac.in domain!');
                process.exit(0);
            });
    } catch (error) {
        console.error('❌ Alumni seeding failed:', error);
        process.exit(1);
    }
};

seedAlumniFromCSV();
