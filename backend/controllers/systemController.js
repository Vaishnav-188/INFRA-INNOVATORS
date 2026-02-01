import SystemConfig from '../models/SystemConfig.js';

// @desc    Get system settings
// @route   GET /api/system/settings
// @access  Public
export const getSettings = async (req, res) => {
    try {
        let settings = await SystemConfig.findOne();

        if (!settings) {
            settings = await SystemConfig.create({});
        }

        res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update system settings
// @route   PUT /api/system/settings
// @access  Private (Admin only)
export const updateSettings = async (req, res) => {
    try {
        let settings = await SystemConfig.findOne();

        if (!settings) {
            settings = new SystemConfig();
        }

        if (req.body.donationSettings) {
            settings.donationSettings = {
                ...settings.donationSettings,
                ...req.body.donationSettings
            };
        }

        if (req.body.collegeEmailDomain) {
            settings.collegeEmailDomain = req.body.collegeEmailDomain;
        }

        settings.updatedBy = req.user._id;
        await settings.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// @desc    Upload QR code image
// @route   POST /api/system/upload-qr
// @access  Private (Admin only)
export const uploadQrCode = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        const qrCodeUrl = `http://localhost:5000/uploads/images/${req.file.filename}`;

        let settings = await SystemConfig.findOne();
        if (!settings) {
            settings = new SystemConfig();
        }

        settings.donationSettings.qrCodeUrl = qrCodeUrl;
        settings.updatedBy = req.user._id;
        await settings.save();

        res.json({
            success: true,
            message: 'QR Code uploaded successfully',
            qrCodeUrl,
            settings
        });
    } catch (error) {
        console.error('Error uploading QR code:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
