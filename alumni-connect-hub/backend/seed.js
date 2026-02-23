import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Departments
const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil'];

// Domains and companies for alumni
const domains = ['AI/ML', 'Web Development', 'Mobile Development', 'Data Science', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Blockchain'];
const companies = [
    { name: 'Google', salary: 2500000 },
    { name: 'Microsoft', salary: 2200000 },
    { name: 'Amazon', salary: 2000000 },
    { name: 'Meta', salary: 2300000 },
    { name: 'Apple', salary: 2400000 },
    { name: 'Netflix', salary: 2100000 },
    { name: 'Adobe', salary: 1800000 },
    { name: 'Salesforce', salary: 1900000 },
    { name: 'Oracle', salary: 1700000 },
    { name: 'IBM', salary: 1600000 },
    { name: 'TCS', salary: 800000 },
    { name: 'Infosys', salary: 750000 },
    { name: 'Wipro', salary: 700000 },
    { name: 'Cognizant', salary: 850000 },
    { name: 'Accenture', salary: 900000 },
    { name: 'Capgemini', salary: 850000 },
    { name: 'HCL', salary: 700000 },
    { name: 'Tech Mahindra', salary: 750000 },
    { name: 'Zoho', salary: 1200000 },
    { name: 'Freshworks', salary: 1400000 }
];

const locations = ['Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai', 'Delhi', 'Noida', 'Gurgaon'];

const skills = ['React', 'Node.js', 'Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Flutter', 'React Native', 'Angular', 'Vue.js'];

// Generate students
const generateStudents = (count) => {
    const students = [];
    const currentYear = 2026;

    for (let i = 1; i <= count; i++) {
        const yearOfStudy = Math.floor(Math.random() * 4) + 1; // 1-4
        const startYear = currentYear - yearOfStudy;
        const endYear = startYear + 4;
        const dept = departments[i % departments.length];

        const student = {
            name: `Student ${i}`,
            username: `student${i}`,
            collegeEmail: `student${i}@kgkite.ac.in`,
            password: 'Student@123', // Will be hashed by model
            role: 'student',
            mobileNumber: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            rollNumber: `${startYear}${String(i).padStart(3, '0')}`,
            registerNumber: `REG${currentYear}${String(i).padStart(4, '0')}`,
            department: dept,
            yearOfStudy,
            batch: `${startYear}-${endYear}`,
            githubRepo: `https://github.com/student${i}`,
            projectDomains: [
                domains[Math.floor(Math.random() * domains.length)],
                domains[Math.floor(Math.random() * domains.length)]
            ],
            interests: [
                skills[Math.floor(Math.random() * skills.length)],
                skills[Math.floor(Math.random() * skills.length)],
                skills[Math.floor(Math.random() * skills.length)]
            ]
        };

        students.push(student);
    }

    return students;
};

// Generate alumni
const generateAlumni = () => {
    const alumni = [];
    const studyPeriods = [
        { period: '2020-2024', gradYear: 2024 },
        { period: '2021-2025', gradYear: 2025 }
    ];

    let alumniId = 1;

    // Generate 30-40 alumni for each batch
    studyPeriods.forEach(({ period, gradYear }) => {
        const batchSize = Math.floor(Math.random() * 11) + 30; // 30-40 alumni per batch

        for (let i = 0; i < batchSize; i++) {
            const company = companies[Math.floor(Math.random() * companies.length)];
            const isPlaced = Math.random() > 0.15; // 85% placement rate
            const domain = domains[Math.floor(Math.random() * domains.length)];

            const alumnus = {
                name: `Alumni ${alumniId}`,
                username: `alumni${alumniId}`,
                collegeEmail: `alumni${alumniId}@kgkite.ac.in`,
                password: 'Alumni@123', // Will be hashed by model
                role: 'alumni',
                mobileNumber: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
                department: departments[alumniId % departments.length],
                graduationYear: gradYear,
                studyPeriod: period,
                currentCompany: isPlaced ? company.name : 'Not Placed',
                isPlaced,
                jobRole: isPlaced ? `${domain} Engineer` : null,
                domain,
                location: isPlaced ? locations[Math.floor(Math.random() * locations.length)] : null,
                salary: isPlaced ? company.salary + Math.floor(Math.random() * 500000) : null,
                skills: [
                    skills[Math.floor(Math.random() * skills.length)],
                    skills[Math.floor(Math.random() * skills.length)],
                    skills[Math.floor(Math.random() * skills.length)],
                    skills[Math.floor(Math.random() * skills.length)]
                ],
                interests: [domain],
                linkedIn: `https://linkedin.com/in/alumni${alumniId}`,
                github: `https://github.com/alumni${alumniId}`,
                bio: `Passionate ${domain} professional with expertise in modern technologies.`,
                isAvailableForMentorship: Math.random() > 0.3 // 70% available
            };

            alumni.push(alumnus);
            alumniId++;
        }
    });

    return alumni;
};

// Seed the database
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({ role: { $in: ['student', 'alumni'] } });

        console.log('👨‍🎓 Creating students...');
        const students = generateStudents(70); // 70 students

        console.log('👔 Creating alumni...');
        const alumni = generateAlumni(); // 30-40 per batch = 60-80 total

        console.log(`📝 Generated ${students.length} students and ${alumni.length} alumni`);

        console.log('💾 Saving to database...');
        // Save students
        for (const student of students) {
            await User.create(student);
        }
        console.log(`✅ ${students.length} students added`);

        // Save alumni
        for (const alumnus of alumni) {
            await User.create(alumnus);
        }
        console.log(`✅ ${alumni.length} alumni added`);

        // Create admin if doesn't exist
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                name: 'Admin',
                username: 'admin',
                collegeEmail: 'admin@college.edu',
                password: 'Admin@123',
                role: 'admin'
            });
            console.log('✅ Admin user created (username: admin, password: Admin@123)');
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Students: ${students.length}`);
        console.log(`   Alumni: ${alumni.length}`);
        console.log(`   Total Users: ${students.length + alumni.length + 1}`);
        console.log('\n🔐 Login Credentials:');
        console.log('   Admin: admin@college.edu / Admin@123');
        console.log('   Students: student1@college.edu to student70@college.edu / Student@123');
        console.log('   Alumni: alumni1@college.edu onwards / Alumni@123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
