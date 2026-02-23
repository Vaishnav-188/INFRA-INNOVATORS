import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PreVerifiedStudent from '../models/PreVerifiedStudent.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Verify email exists in pre-verified list
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
    try {
        const { collegeEmail, role } = req.body;

        if (!collegeEmail || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and role'
            });
        }

        const email = collegeEmail.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await User.findOne({ collegeEmail: email });

        if (existingUser) {
            // User exists - check if password is initialized
            if (existingUser.passwordInitialized) {
                return res.status(400).json({
                    success: false,
                    message: 'Account already exists. Please login instead.',
                    accountExists: true
                });
            } else {
                // User exists but hasn't set password yet (from CSV upload)
                return res.status(200).json({
                    success: true,
                    message: 'Email verified. Please set your password.',
                    verified: true,
                    user: {
                        name: existingUser.name,
                        email: existingUser.collegeEmail,
                        role: existingUser.role
                    }
                });
            }
        }

        // Check if email is in pre-verified list for students
        if (role === 'student') {
            const preVerified = await PreVerifiedStudent.findOne({
                collegeEmail: email
            });

            if (preVerified) {
                return res.status(200).json({
                    success: true,
                    message: 'Email verified. Please set your password.',
                    verified: true,
                    preVerified: true,
                    user: {
                        name: preVerified.name,
                        email: preVerified.collegeEmail,
                        role: 'student'
                    }
                });
            }
        }

        // Email not found in system
        return res.status(404).json({
            success: false,
            message: `Email not found in our records. Please contact admin to add you to the system.`,
            verified: false
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification',
            error: error.message
        });
    }
};

// @desc    Register new user (after email verification)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { name, collegeEmail, password, role, ...otherFields } = req.body;

        // Validation
        if (!name || !collegeEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        const email = collegeEmail.toLowerCase().trim();

        // Check if user already exists
        let existingUser = await User.findOne({ collegeEmail: email });

        if (existingUser && existingUser.passwordInitialized) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists. Please login.'
            });
        }

        let user;
        let isAutoVerified = false;

        if (existingUser) {
            // User exists from CSV upload - just set password
            existingUser.password = password;
            existingUser.passwordInitialized = true;

            // Update other fields if provided
            if (otherFields.mobileNumber) existingUser.mobileNumber = otherFields.mobileNumber;
            if (otherFields.linkedIn) existingUser.linkedIn = otherFields.linkedIn;
            if (otherFields.github) existingUser.github = otherFields.github;

            await existingUser.save();
            user = existingUser;
            isAutoVerified = user.isVerified;
        } else {
            // Check if email is pre-verified for students
            if (role === 'student') {
                const preVerified = await PreVerifiedStudent.findOne({
                    collegeEmail: email
                });
                if (preVerified) {
                    isAutoVerified = true;
                }
            }

            // Create new user
            const userData = {
                name,
                collegeEmail: email,
                password,
                role: role || 'student',
                isVerified: isAutoVerified || role === 'alumni', // Admins now need manual approval
                passwordInitialized: true,
                ...otherFields
            };

            user = await User.create(userData);

            // Add to PreVerifiedStudent for future reference
            if (role === 'student' && isAutoVerified) {
                try {
                    await PreVerifiedStudent.findOneAndUpdate(
                        { collegeEmail: email },
                        {
                            name: user.name,
                            rollNumber: otherFields.rollNumber || 'N/A',
                            department: otherFields.department,
                            batch: otherFields.batch
                        },
                        { upsert: true }
                    );
                } catch (e) {
                    console.error('Error updating pre-verified list:', e);
                }
            }
        }

        console.log(`[REGISTER] User registered: ${user.collegeEmail}, Role: ${user.role}, Verified: ${user.isVerified}`);

        // For unverified users, don't return token
        if (!user.isVerified) {
            return res.status(201).json({
                success: true,
                message: 'Registration successful! Your account is pending admin approval.',
                user: {
                    _id: user._id,
                    name: user.name,
                    collegeEmail: user.collegeEmail,
                    role: user.role,
                    isVerified: false
                }
            });
        }

        // Generate token for verified users
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                _id: user._id,
                name: user.name,
                collegeEmail: user.collegeEmail,
                role: user.role,
                isVerified: true
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { collegeEmail, password, role: requiredRole } = req.body;

        // Validation
        if (!collegeEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ collegeEmail: collegeEmail.toLowerCase().trim() }).select('+password');

        if (!user) {
            console.log(`[DEBUG] Login failed: User not found with email ${collegeEmail}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check for role consistency if requiredRole is provided
        // Admin can login as any role, but students/alumni must match their registration
        if (requiredRole && user.role !== 'admin' && user.role !== requiredRole) {
            console.log(`[DEBUG] Login failed: Role mismatch. User is ${user.role}, required ${requiredRole}`);

            // Helpful message for students who have transitioned to alumni
            if (user.role === 'alumni' && requiredRole === 'student') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been upgraded to Alumni. Please select Alumni role to login.'
                });
            }

            return res.status(403).json({
                success: false,
                message: `This account is registered as ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}. Please select the correct role.`
            });
        }

        // Check password
        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            console.log(`[DEBUG] Login failed: Password mismatch for ${collegeEmail}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is verified
        // Admins are always allowed to login to manage the system
        // Students and Alumni (especially transitioned ones) need verification
        if (user.role !== 'admin' && !user.isVerified) {
            console.log(`[DEBUG] Login blocked: User ${collegeEmail} (${user.role}) is NOT verified`);
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for verification.'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                collegeEmail: user.collegeEmail,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Protected
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile',
            error: error.message
        });
    }
};
