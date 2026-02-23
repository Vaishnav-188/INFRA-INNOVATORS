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
    homepageSettings: {
        successStories: [
            {
                name: { type: String, default: 'Marcus Sterling' },
                role: { type: String, default: 'CEO @ OrbitGlobal' },
                batch: { type: String, default: "Class of '14" },
                quote: { type: String, default: 'This institution gave me more than just a degree; it gave me a mindset. Staying connected via this portal has been vital for my professional growth.' },
                avatar: { type: String, default: 'https://i.pravatar.cc/150?u=4' }
            },
            {
                name: { type: String, default: 'Dr. Sarah Vance' },
                role: { type: String, default: 'Medical Lead' },
                batch: { type: String, default: "Class of '19" },
                quote: { type: String, default: 'Giving back through mentorship on this platform allows me to stay engaged with the brilliant minds coming out of our college every year.' },
                avatar: { type: String, default: 'https://i.pravatar.cc/150?u=9' }
            }
        ],
        galleryImages: {
            type: [String],
            default: [
                'https://picsum.photos/500/500?random=10',
                'https://picsum.photos/500/500?random=11',
                'https://picsum.photos/500/500?random=12',
                'https://picsum.photos/500/500?random=13'
            ]
        }
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
