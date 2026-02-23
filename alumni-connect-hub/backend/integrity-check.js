import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const checkCsvIntegrity = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const alumniContent = fs.readFileSync('sample-csv/alumni_clean.csv', 'utf8');
        const lines = alumniContent.split('\n').filter(l => l.trim());
        const dataLines = lines.slice(1);

        console.log(`CSV Data Lines: ${dataLines.length}`);

        let found = 0;
        let missing = 0;

        for (const line of dataLines) {
            const email = line.split(',')[1];
            if (!email) continue;

            const user = await User.findOne({ collegeEmail: email.toLowerCase().trim() });
            if (user) {
                found++;
            } else {
                missing++;
                if (missing < 5) console.log(`Missing: ${email}`);
            }
        }

        console.log(`Found in DB: ${found}`);
        console.log(`Missing in DB: ${missing}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkCsvIntegrity();
