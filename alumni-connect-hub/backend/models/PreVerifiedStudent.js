import mongoose from 'mongoose';

const preVerifiedStudentSchema = new mongoose.Schema({
    collegeEmail: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    department: String,
    batch: String
}, {
    timestamps: true
});

const PreVerifiedStudent = mongoose.model('PreVerifiedStudent', preVerifiedStudentSchema);

export default PreVerifiedStudent;
