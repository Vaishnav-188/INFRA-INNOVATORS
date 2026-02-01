import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PreVerifiedStudent from '../models/PreVerifiedStudent.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Register new user
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

        // Check if user already exists
        const existingUser = await User.findOne({ collegeEmail: collegeEmail.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check if user exists in pre-verified list (for students)
        let isAutoVerified = false;
        if (role === 'student' || !role) {
            const preVerified = await PreVerifiedStudent.findOne({
                collegeEmail: collegeEmail.toLowerCase().trim()
            });
            console.log(`[DEBUG] Registration check for ${collegeEmail}: preVerified Found? ${!!preVerified}`);
            if (preVerified) {
                isAutoVerified = true;
            }
        }

        // Create user
        const userData = {
            name,
            collegeEmail: collegeEmail.toLowerCase(),
            password,
            role: role || 'student',
            isVerified: isAutoVerified || role === 'alumni',
            ...otherFields
        };

        console.log(`[DEBUG] Creating user: ${collegeEmail}, role: ${userData.role}, isVerified: ${userData.isVerified}`);
        const user = await User.create(userData);
        console.log(`[DEBUG] User created! _id: ${user._id}, isVerified: ${user.isVerified}`);

        // For students and admins, we don't return a token yet because they need admin approval
        if ((user.role === 'student' || user.role === 'admin') && !user.isVerified) {
            return res.status(201).json({
                success: true,
                message: 'Registration successful! Your account is pending admin approval. You will be able to login once verified.',
                user: {
                    _id: user._id,
                    name: user.name,
                    collegeEmail: user.collegeEmail,
                    role: user.role,
                    isVerified: false
                }
            });
        }

        // Generate token for verified users (including alumni and admin)
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
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
        const { collegeEmail, password } = req.body;

        // Validation
        if (!collegeEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ collegeEmail: collegeEmail.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is verified (for students and admins)
        if ((user.role === 'student' || user.role === 'admin') && !user.isVerified) {
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
