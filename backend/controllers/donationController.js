import Donation from '../models/Donation.js';
import User from '../models/User.js';

// @desc    Get current user's donations
// @route   GET /api/donations/my
// @access  Private (Alumni only)
export const getMyDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            donations
        });
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a new donation request (informal, just logging the intent/manual payment)
// @route   POST /api/donations
// @access  Private (Alumni only)
export const createDonation = async (req, res) => {
    try {
        const { amount, purpose, message, transactionId } = req.body;

        if (!amount || !transactionId) {
            return res.status(400).json({ success: false, message: 'Amount and Transaction ID are required' });
        }

        const donation = await Donation.create({
            donor: req.user._id,
            amount,
            purpose,
            message,
            transactionId,
            paymentStatus: 'completed' // For this specific request, let's assume it's completed once they submit the detail
        });

        res.status(201).json({
            success: true,
            message: 'Thank you for your donation!',
            donation
        });
    } catch (error) {
        console.error('Error creating donation:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Transaction ID already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all donations (for admin)
// @route   GET /api/donations
// @access  Private (Admin only)
export const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate('donor', 'name email collegeEmail')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            donations
        });
    } catch (error) {
        console.error('Error fetching all donations:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
