import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@university.edu';
const ADMIN_PASSWORD = 'Admin@2024';

// Login as admin to get token
async function loginAdmin() {
    try {
        console.log(`🔐 Logging in as admin (${ADMIN_EMAIL})...`);

        const response = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            })
        });

        const data = await response.json();

        if (data.success && data.token) {
            console.log('✅ Admin login successful\n');
            return data.token;
        } else {
            console.error('❌ Admin login failed:', data.message);
            console.error('   Please ensure admin account exists with correct credentials\n');
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

        console.log(`📤 Uploading: ${path.basename(filePath)}`);
        console.log(`   Endpoint: /api/csv/${endpoint}\n`);

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
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   Alumni Data Upload to Database              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Step 1: Login as admin
    const token = await loginAdmin();
    if (!token) {
        console.error('❌ Cannot proceed without admin token');
        console.error('   Make sure the backend server is running on http://localhost:5000');
        process.exit(1);
    }

    // Step 2: Upload alumni_clean.csv
    const alumniPath = path.join(__dirname, 'sample-csv', 'alumni_clean.csv');

    if (!fs.existsSync(alumniPath)) {
        console.error('❌ alumni_clean.csv not found at:', alumniPath);
        process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const alumniResult = await uploadCSV(token, alumniPath, 'upload-alumni');

    if (alumniResult.success) {
        console.log('✅ Alumni uploaded successfully!\n');
        console.log('📊 Upload Summary:');
        console.log(`   ├─ Total rows processed: ${alumniResult.summary?.totalRows || 'N/A'}`);
        console.log(`   ├─ Successfully inserted: ${alumniResult.summary?.inserted || 'N/A'}`);
        console.log(`   └─ Skipped (duplicates): ${alumniResult.summary?.skipped || 0}\n`);

        if (alumniResult.summary?.errors && alumniResult.summary.errors.length > 0) {
            console.log('⚠️  Errors encountered:');
            alumniResult.summary.errors.forEach(err => {
                console.log(`   Row ${err.row}: ${err.error}`);
            });
            console.log('');
        }

        if (alumniResult.alumni && alumniResult.alumni.length > 0) {
            console.log('👥 Sample Alumni Added:');
            alumniResult.alumni.slice(0, 5).forEach((alumni, idx) => {
                console.log(`   ${idx + 1}. ${alumni.name} - ${alumni.currentCompany || 'N/A'} (${alumni.jobRole || 'Alumni'})`);
            });
            if (alumniResult.alumni.length > 5) {
                console.log(`   ... and ${alumniResult.alumni.length - 5} more\n`);
            }
        }
    } else {
        console.error('❌ Alumni upload failed!');
        console.error(`   Error: ${alumniResult.message}\n`);
        process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Upload Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Login as admin: admin@university.edu / Admin@2024');
    console.log('   2. Go to Admin Dashboard → Users');
    console.log('   3. Verify and approve alumni accounts');
    console.log('   4. Students can now search for these alumni in "Find Mentors"\n');
}

main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    console.error('   Stack:', error.stack);
    process.exit(1);
});
