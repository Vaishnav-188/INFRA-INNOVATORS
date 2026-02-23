import fs from 'fs';
import csv from 'csv-parser';
import User from '../models/User.js';
import PreVerifiedStudent from '../models/PreVerifiedStudent.js';
import path from 'path';

// Helper function to generate random password
const generatePassword = () => {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// @desc    Upload Student CSV
// @route   POST /api/csv/upload-students
// @access  Protected - Admin only
export const uploadStudentCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a CSV file'
            });
        }

        const filePath = req.file.path;
        const results = [];
        const errors = [];
        let inserted = 0;
        let skipped = 0;
        const newUsers = []; // Track new users with their auto-generated passwords

        // Read CSV file
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
            }))
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', async () => {
                console.log(`[CSV] Processing ${results.length} rows. Available headers: ${results.length > 0 ? Object.keys(results[0]).join(', ') : 'NONE'}`);

                // Process each row
                for (const [index, row] of results.entries()) {
                    let email = null;
                    try {
                        // Required fields check (now case-insensitive due to mapHeaders)
                        const name = row.name || row.fullname || row.studentname;
                        email = row.collegeemail || row.email || row.college_email;

                        if (!name || !email) {
                            errors.push({
                                row: index + 2,
                                error: `Missing required fields: name/email. Found keys: ${Object.keys(row).join(', ')}`
                            });
                            skipped++;
                            continue;
                        }

                        // Check if user already exists
                        let user = await User.findOne({
                            collegeEmail: email.toLowerCase().trim()
                        });

                        if (user) {
                            if (user.isVerified) {
                                errors.push({
                                    row: index + 2,
                                    email: row.collegeEmail,
                                    error: 'User already exists and is already verified'
                                });
                                skipped++;
                                continue;
                            } else {
                                // Update existing unverified user to verified
                                user.isVerified = true;
                                if (row.rollnumber) user.rollNumber = row.rollnumber.trim();
                                if (row.department) user.department = row.department.trim();
                                await user.save();
                                inserted++;
                                console.log(`[CSV] Automatically verified existing user: ${user.collegeEmail}`);
                                continue;
                            }
                        }

                        // Create new user if not exists
                        // DO NOT SET PASSWORD - user will set it during first-time signup
                        const projectDomains = row.projectdomains ? row.projectdomains.split(',').map(d => d.trim()) : [];
                        const interests = row.interests ? row.interests.split(',').map(i => i.trim()) : [];

                        const emailPrefix = email.split('@')[0].toLowerCase();
                        const userData = {
                            name: name.trim(),
                            username: row.username ? row.username.trim().toLowerCase() : emailPrefix,
                            collegeEmail: email.toLowerCase().trim(),
                            password: 'TEMP_WILL_BE_SET_BY_USER',
                            role: 'student',
                            mobileNumber: row.mobilenumber || row.phone ? (row.mobilenumber || row.phone).trim() : undefined,
                            rollNumber: row.rollnumber ? row.rollnumber.trim() : undefined,
                            registerNumber: row.registernumber ? row.registernumber.trim() : undefined,
                            department: row.department ? row.department.trim() : undefined,
                            yearOfStudy: row.yearofstudy ? parseInt(row.yearofstudy) : undefined,
                            batch: row.batch ? row.batch.trim() : undefined,
                            githubRepo: row.githubrepo ? row.githubrepo.trim() : undefined,
                            projectDomains: projectDomains,
                            interests: interests,
                            isVerified: true,
                            passwordInitialized: false
                        };

                        Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);
                        user = await User.create(userData);

                        // Push to newUsers for response
                        newUsers.push({
                            name: user.name,
                            email: user.collegeEmail,
                            password: 'User will set'
                        });

                        // Also add to PreVerifiedStudent for auto-verification if they sign up manually later
                        try {
                            await PreVerifiedStudent.findOneAndUpdate(
                                { collegeEmail: userData.collegeEmail },
                                {
                                    name: userData.name,
                                    rollNumber: userData.rollNumber || 'N/A',
                                    department: userData.department,
                                    batch: userData.batch
                                },
                                { upsert: true }
                            );
                        } catch (e) {
                            console.error('Error auto-verifying:', e);
                        }

                        inserted++;
                        console.log(`Created student (password pending): ${user.collegeEmail}`);
                    } catch (error) {
                        errors.push({
                            row: index + 2,
                            email: email || 'Unknown',
                            error: error.message
                        });
                        skipped++;
                    }
                }

                // Delete uploaded file after processing
                fs.unlinkSync(filePath);

                // Send response
                res.status(200).json({
                    success: true,
                    message: 'CSV processing completed',
                    summary: {
                        totalRows: results.length,
                        inserted: inserted,
                        skipped: skipped,
                        errors: errors,
                        newUsers: newUsers
                    }
                });
            })
            .on('error', (error) => {
                // Delete uploaded file on error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                res.status(500).json({
                    success: false,
                    message: 'Error processing CSV file',
                    error: error.message
                });
            });
    } catch (error) {
        console.error('Error in student CSV upload:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during CSV upload',
            error: error.message
        });
    }
};

// @desc    Upload Alumni CSV
// @route   POST /api/csv/upload-alumni
// @access  Protected - Admin only
export const uploadAlumniCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a CSV file'
            });
        }

        const filePath = req.file.path;
        const results = [];
        const errors = [];
        let inserted = 0;
        let skipped = 0;
        const newAlumni = [];

        // Read CSV file
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/^\ufeff/, '')
            }))
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', async () => {
                console.log(`[CSV-ALUMNI] Processing ${results.length} rows. Headers: ${results.length > 0 ? Object.keys(results[0]).join(', ') : 'NONE'}`);

                // Process each row
                for (const [index, row] of results.entries()) {
                    let email = null;
                    try {
                        // Required fields check
                        const name = row.name || row.fullname || row.alumniname;
                        email = row.collegeemail || row.email || row.college_email;

                        if (!name || !email) {
                            errors.push({
                                row: index + 2,
                                error: `Missing name or email. Keys found: ${Object.keys(row).join(', ')}`
                            });
                            skipped++;
                            continue;
                        }

                        // Check if user already exists
                        const existingUser = await User.findOne({
                            collegeEmail: email.toLowerCase().trim()
                        });

                        if (existingUser) {
                            errors.push({
                                row: index + 2,
                                email: email,
                                error: 'User with this email already exists'
                            });
                            skipped++;
                            continue;
                        }

                        // Use provided password or default
                        // DO NOT SET PASSWORD - alumni will set it during first-time signup

                        // Determine placement status
                        const currentCompany = row.currentcompany ? row.currentcompany.trim() : (row.company ? row.company.trim() : 'Not Placed');
                        const isPlaced = row.isplaced === 'true' || (currentCompany !== 'Not Placed' && currentCompany !== '');

                        // Parse arrays from comma-separated strings
                        const skills = row.skills ? row.skills.split(',').map(s => s.trim()) : [];
                        const interests = row.interests ? row.interests.split(',').map(i => i.trim()) : [];

                        const emailPrefix = email.split('@')[0].toLowerCase();
                        // Create alumni user with all fields
                        const userData = {
                            name: name.trim(),
                            username: row.username ? row.username.trim().toLowerCase() : `${emailPrefix}_alum`,
                            collegeEmail: email.toLowerCase().trim(),
                            password: 'TEMP_WILL_BE_SET_BY_USER',
                            role: 'alumni',
                            mobileNumber: row.mobilenumber || row.phone ? (row.mobilenumber || row.phone).trim() : undefined,
                            department: row.department ? row.department.trim() : undefined,
                            graduationYear: row.graduationyear ? parseInt(row.graduationyear) : undefined,
                            studyPeriod: row.studyperiod ? row.studyperiod.trim() : undefined,
                            currentCompany: currentCompany,
                            isPlaced: isPlaced,
                            jobRole: row.jobrole && row.jobrole.trim() !== '' ? row.jobrole.trim() : undefined,
                            domain: row.domain ? row.domain.trim() : undefined,
                            location: row.location && row.location.trim() !== '' ? row.location.trim() : undefined,
                            salary: row.salary && row.salary.trim() !== '' ? parseInt(row.salary) : undefined,
                            skills: skills,
                            interests: interests.length > 0 ? interests : (row.domain ? [row.domain.trim()] : []),
                            linkedIn: row.linkedin ? row.linkedin.trim() : undefined,
                            github: row.github ? row.github.trim() : undefined,
                            bio: row.bio ? row.bio.trim() : undefined,
                            isAvailableForMentorship: row.isavailableformentorship !== 'false',
                            isVerified: true,
                            passwordInitialized: false
                        };

                        // Remove undefined fields
                        Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

                        const user = await User.create(userData);

                        // Push to newAlumni for response
                        newAlumni.push({
                            name: user.name,
                            email: user.collegeEmail,
                            password: 'User will set'
                        });

                        inserted++;
                        console.log(`Created alumni (password pending): ${user.collegeEmail}`);
                    } catch (error) {
                        errors.push({
                            row: index + 2,
                            email: email || 'Unknown',
                            error: error.message
                        });
                        skipped++;
                    }
                }

                // Delete uploaded file after processing
                fs.unlinkSync(filePath);

                // Send response
                res.status(200).json({
                    success: true,
                    message: 'CSV processing completed',
                    summary: {
                        totalRows: results.length,
                        inserted: inserted,
                        skipped: skipped,
                        errors: errors,
                        newAlumni: newAlumni
                    }
                });
            })
            .on('error', (error) => {
                // Delete uploaded file on error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                res.status(500).json({
                    success: false,
                    message: 'Error processing CSV file',
                    error: error.message
                });
            });
    } catch (error) {
        console.error('Error in alumni CSV upload:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during CSV upload',
            error: error.message
        });
    }
};
