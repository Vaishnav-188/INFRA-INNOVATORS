import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
    donationSettings: {
        upiId: {
            type: String,
            default: 'college@upi'
        },
        qrCodeUrl: {
            type: String,
            default: ''
        },
        paymentUrl: {
            type: String,
            default: ''
        },
        whyDonateText: {
            type: String,
            default: 'Your contribution helps us improve infrastructure and provide scholarships to deserving students.'
        },
        isDonationUrgent: {
            type: Boolean,
            default: false
        },
        urgentMessage: {
            type: String,
            default: 'Important: We are raising funds for the upcoming Annual Tech Fest.'
        }
    },
    collegeEmailDomain: {
        type: String,
        default: 'kgkite.ac.in'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;
