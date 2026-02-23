import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide donation amount'],
        min: [1, 'Amount must be greater than 0']
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    purpose: {
        type: String,
        enum: ['infrastructure', 'scholarship', 'research', 'general', 'event', 'other'],
        default: 'general'
    },
    message: {
        type: String,
        maxlength: 500
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'netbanking', 'qr', 'other'],
        default: 'upi'
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    qrCodeRef: {
        type: String
    },
    receiptUrl: {
        type: String
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    taxExemptionRequested: {
        type: Boolean,
        default: false
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    },
    notes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for analytics and reporting
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ purpose: 1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function () {
    return `${this.currency} ${this.amount.toLocaleString()}`;
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
