import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5000/api';

// First, login as admin to get token
async function loginAdmin() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                collegeEmail: 'admin@college.edu',
                password: 'Admin@123'
            })
        });

        const data = await response.json();

        if (data.success && data.token) {
            console.log('✅ Admin login successful');
            return data.token;
        } else {
            console.error('❌ Admin login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return null;
    }
}

// Upload CSV file
async function uploadCSV(token, filePath, endpoint) {
    try {
        const form = new FormData();
        form.append('csvFile', fs.createReadStream(filePath));

        const response = await fetch(`${API_URL}/csv/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Upload error:', error.message);
        return { success: false, message: error.message };
    }
}

// Main function
async function main() {
    console.log('🚀 Starting CSV Upload Process...\n');

    // Step 1: Login as admin
    const token = await loginAdmin();
    if (!token) {
        console.error('❌ Cannot proceed without admin token');
        process.exit(1);
    }

    // Step 2: Upload students template
    console.log('\n📤 Uploading students_template.csv...');
    const studentsPath = path.join(__dirname, 'sample-csv', 'students_template.csv');

    if (!fs.existsSync(studentsPath)) {
        console.error('❌ students_template.csv not found at:', studentsPath);
    } else {
        const studentsResult = await uploadCSV(token, studentsPath, 'upload-students');

        if (studentsResult.success) {
            console.log('✅ Students uploaded successfully!');
            console.log(`   Total rows: ${studentsResult.summary.totalRows}`);
            console.log(`   Inserted: ${studentsResult.summary.inserted}`);
            console.log(`   Skipped: ${studentsResult.summary.skipped}`);

            if (studentsResult.summary.errors.length > 0) {
                console.log('   Errors:');
                studentsResult.summary.errors.forEach(err => {
                    console.log(`     Row ${err.row}: ${err.error}`);
                });
            }
        } else {
            console.error('❌ Students upload failed:', studentsResult.message);
        }
    }

    // Step 3: Upload alumni template
    console.log('\n📤 Uploading alumni_template.csv...');
    const alumniPath = path.join(__dirname, 'sample-csv', 'alumni_template.csv');

    if (!fs.existsSync(alumniPath)) {
        console.error('❌ alumni_template.csv not found at:', alumniPath);
    } else {
        const alumniResult = await uploadCSV(token, alumniPath, 'upload-alumni');

        if (alumniResult.success) {
            console.log('✅ Alumni uploaded successfully!');
            console.log(`   Total rows: ${alumniResult.summary.totalRows}`);
            console.log(`   Inserted: ${alumniResult.summary.inserted}`);
            console.log(`   Skipped: ${alumniResult.summary.skipped}`);

            if (alumniResult.summary.errors.length > 0) {
                console.log('   Errors:');
                alumniResult.summary.errors.forEach(err => {
                    console.log(`     Row ${err.row}: ${err.error}`);
                });
            }
        } else {
            console.error('❌ Alumni upload failed:', alumniResult.message);
        }
    }

    console.log('\n🎉 CSV Upload Process Complete!');
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
