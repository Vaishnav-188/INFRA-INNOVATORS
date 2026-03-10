import mongoose from 'mongoose';
import ResumeApplication from './backend/models/ResumeApplication.js';
import Job from './backend/models/Job.js';
import User from './backend/models/User.js';

const MONGODB_URI = 'mongodb://localhost:27017/alumni-management';

async function checkApps() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const apps = await ResumeApplication.find()
            .populate('student', 'name username collegeEmail')
            .populate('job', 'title postedBy');

        console.log('Total Applications:', apps.length);

        const jobs = await Job.find().populate('postedBy', 'name');
        console.log('Total Jobs:', jobs.length);

        const summary = apps.map(app => ({
            id: app._id,
            studentName: app.student?.name,
            jobTitle: app.job?.title,
            jobPoster: app.job?.postedBy,
            status: app.status
        }));

        console.log('--- Applications Summary ---');
        console.table(summary);

        const jobSummary = jobs.map(j => ({
            id: j._id,
            title: j.title,
            poster: j.postedBy?.name
        }));
        console.log('--- Jobs Summary ---');
        console.table(jobSummary);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

checkApps();
