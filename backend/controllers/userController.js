import User from '../models/User.js';
import Event from '../models/Event.js';
import Donation from '../models/Donation.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};

        const users = await User.find(query).select('-password').sort('-createdAt');

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const [total, students, alumni, admins, placedAlumni, unverifiedStudents, pendingEvents, donations] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'alumni' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'alumni', isPlaced: true }),
            User.countDocuments({
                role: { $in: ['student', 'admin'] },
                $or: [
                    { isVerified: false },
                    { isVerified: { $exists: false } }
                ]
            }),
            Event.countDocuments({ status: 'pending' }),
            Donation.find()
        ]);

        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
        console.log(`[STATS] S:${students}, A:${alumni}, Unverified Students:${unverifiedStudents}, Pending Events: ${pendingEvents}`);

        res.json({
            success: true,
            stats: {
                total,
                students,
                alumni,
                admins,
                placedAlumni,
                unverifiedUsers: unverifiedStudents,
                pendingEvents,
                totalDonations: totalDonations,
                placementRate: alumni > 0 ? ((placedAlumni / alumni) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get top placed alumni (public)
export const getTopAlumni = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const topAlumni = await User.find({
            role: 'alumni',
            isPlaced: true,
            salary: { $exists: true, $ne: null }
        })
            .select('name currentCompany jobRole domain location salary graduationYear linkedIn')
            .sort('-salary')
            .limit(limit);

        res.json({
            success: true,
            count: topAlumni.length,
            alumni: topAlumni
        });
    } catch (error) {
        console.error('Error fetching top alumni:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get pending verifications (students who are not yet verified)
export const getPendingVerifications = async (req, res) => {
    try {
        const pending = await User.find({
            role: { $in: ['student', 'admin'] },
            $or: [
                { isVerified: false },
                { isVerified: { $exists: false } }
            ]
        }).select('name rollNumber yearOfStudy linkedIn collegeEmail github role');

        console.log(`[DEBUG] Found ${pending.length} pending verifications`);
        if (pending.length > 0) {
            console.log(`[DEBUG] First pending user: ${pending[0].collegeEmail}, role: ${pending[0].role}, isVerified: ${pending[0].isVerified}`);
        }

        res.json({
            success: true,
            count: pending.length,
            verifications: pending
        });
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Verify a user
export const verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isVerified = true;
        await user.save();

        res.json({
            success: true,
            message: 'User verified successfully'
        });
    } catch (error) {
        console.error('Error verifying user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Reject/Delete a user
export const rejectUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User rejected and removed'
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
