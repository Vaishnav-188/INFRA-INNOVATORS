import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';

// @desc    Get all verified students with GitHub profiles (for alumni)
// @route   GET /api/mentorship/students
// @access  Private (Alumni)
export const getStudentsForMentorship = async (req, res) => {
    try {
        // Fetch all verified students with GitHub profiles
        const students = await User.find({
            role: 'student',
            isVerified: true,
            githubRepo: { $exists: true, $ne: null, $ne: '' }
        })
            .select('name username collegeEmail department batch yearOfStudy githubRepo projectDomains interests skills bio')
            .sort({ batch: -1, name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students'
        });
    }
};

// @desc    Get incoming mentorship requests (student-initiated, no alumni assigned)
// @route   GET /api/mentorship/requests/incoming
// @access  Private (Alumni)
export const getIncomingMentorshipRequests = async (req, res) => {
    try {
        // Get all mentorship requests where student initiated (no specific alumni or open to all)
        const requests = await MentorshipRequest.find({
            $or: [
                { alumni: { $exists: false } },  // No alumni assigned yet
                { alumni: null }  // Explicitly null
            ]
        })
            .populate('student', 'name username collegeEmail department batch yearOfStudy githubRepo projectDomains interests skills')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error('Error fetching incoming requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incoming requests'
        });
    }
};

// @desc    Get mentorship requests for user (alumni or student)
// @route   GET /api/mentorship/requests
// @access  Private
export const getMyMentorshipRequests = async (req, res) => {
    try {
        let requests;

        if (req.user.role === 'student') {
            // For students, get requests where they are the student
            requests = await MentorshipRequest.find({
                student: req.user._id
            })
                .populate('alumni', 'name username email currentCompany currentPosition linkedIn')
                .sort({ createdAt: -1 })
                .lean();
        } else {
            // For alumni, get requests where they are the alumni
            requests = await MentorshipRequest.find({
                alumni: req.user._id
            })
                .populate('student', 'name username collegeEmail department batch githubRepo')
                .sort({ createdAt: -1 })
                .lean();
        }

        res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error('Error fetching mentorship requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mentorship requests'
        });
    }
};

// @desc    Create a mentorship request (Alumni initiates)
// @route   POST /api/mentorship/request
// @access  Private (Alumni)
export const createMentorshipRequest = async (req, res) => {
    try {
        const { studentId, message, domain } = req.body;

        // Validate student exists
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if request already exists
        const existingRequest = await MentorshipRequest.findOne({
            student: studentId,
            alumni: req.user._id,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active mentorship request with this student'
            });
        }

        // Create new request
        const mentorshipRequest = await MentorshipRequest.create({
            student: studentId,
            alumni: req.user._id,
            domain: domain || 'General',
            message: message || 'I would like to mentor you',
            status: 'pending',
            approvedByAdmin: false
        });

        await mentorshipRequest.populate('student', 'name username collegeEmail department batch');

        res.status(201).json({
            success: true,
            message: 'Mentorship request sent successfully',
            request: mentorshipRequest
        });
    } catch (error) {
        console.error('Error creating mentorship request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create mentorship request'
        });
    }
};

// @desc    Update mentorship request status
// @route   PATCH /api/mentorship/requests/:id
// @access  Private
export const updateMentorshipRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await MentorshipRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Mentorship request not found'
            });
        }

        // Authorization and logic based on role
        if (req.user.role === 'alumni') {
            // Case 1: Alumni accepting a student-initiated request (no alumni assigned yet)
            if (!request.alumni || request.alumni === null) {
                if (status === 'accepted') {
                    request.alumni = req.user._id;
                    request.status = 'accepted';
                } else if (status === 'rejected') {
                    // Note: In a real system, we might want to track which alumni rejected it
                    // so it doesn't show up for them again, but for now we just update status
                    request.status = 'rejected';
                }
            } else {
                // Case 2: Alumni updating a request they are already part of
                if (request.alumni.toString() !== req.user._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to update this request'
                    });
                }
                request.status = status;
            }
        } else if (req.user.role === 'student') {
            // Case 3: Student updating a request they are part of
            if (request.student.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this request'
                });
            }

            // Students can accept/reject alumni-initiated requests or cancel their own
            request.status = status;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Invalid role for this action'
            });
        }

        await request.save();

        res.status(200).json({
            success: true,
            message: `Mentorship request ${status} successfully`,
            request
        });
    } catch (error) {
        console.error('Error updating mentorship request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mentorship request'
        });
    }
};

// @desc    Get student by ID (for viewing profile)
// @route   GET /api/mentorship/students/:id
// @access  Private (Alumni)
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await User.findOne({
            _id: id,
            role: 'student'
        })
            .select('-password')
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            student
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student details'
        });
    }
};
