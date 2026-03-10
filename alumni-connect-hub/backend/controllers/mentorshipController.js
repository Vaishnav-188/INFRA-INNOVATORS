import User from '../models/User.js';
import MentorshipRequest from '../models/MentorshipRequest.js';
import nodemailer from 'nodemailer';

// ─── Email transporter (reused across requests) ───────────────────────────────
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
        process.env.EMAIL_USER === 'your_gmail@gmail.com') {
        return null; // Not configured
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Sends a mentorship acceptance email to the student.
 * Returns true if sent, false otherwise.
 */
const sendMentorshipAcceptanceEmail = async (studentEmail, studentName, alumniName, domain, mentorshipId) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.warn('[EMAIL] Transporter not configured — skipping email send');
        return false;
    }

    const chatUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/mentorship-chat/${mentorshipId}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mentorship Accepted</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px; }
    .body { padding: 36px 32px; }
    .congrats { font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 16px; }
    .message { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
    .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; }
    .info-box p { margin: 0; font-size: 14px; color: #0369a1; }
    .info-box strong { color: #0c4a6e; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; }
    .cta-wrap { text-align: center; margin-bottom: 28px; }
    .note { font-size: 13px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 ALUMNI<span style="color:#93c5fd">HUB</span></h1>
      <p>Your Mentorship Has Been Confirmed!</p>
    </div>
    <div class="body">
      <p class="congrats">🎉 Congratulations, ${studentName}!</p>
      <p class="message">
        Great news — <strong>${alumniName}</strong> has accepted your mentorship request 
        in the <strong>${domain}</strong> domain. Your mentor connection is now active and 
        your personalised AI roadmap is ready!
      </p>
      <div class="info-box">
        <p>📌 <strong>Mentor:</strong> ${alumniName}</p>
        <p style="margin-top:8px;">🗺️ <strong>Domain:</strong> ${domain}</p>
        <p style="margin-top:8px;">💬 <strong>Status:</strong> Connected — messaging is now enabled</p>
      </div>
      <div class="cta-wrap">
        <a href="${chatUrl}" class="cta-btn">🚀 Open Your AI Roadmap &amp; Chat</a>
      </div>
      <p class="note">
        This email was sent by AlumniHub. If you did not request mentorship, please ignore this email.<br>
        © ${new Date().getFullYear()} AlumniHub — KGiSL Institute of Technology
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
        await transporter.sendMail({
            from: `"AlumniHub 🎓" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: `🎉 Mentorship Accepted by ${alumniName} — Your Chat is Now Open!`,
            html: htmlBody
        });
        console.log(`[EMAIL] Acceptance email sent to ${studentEmail}`);
        return true;
    } catch (err) {
        console.error('[EMAIL] Failed to send acceptance email:', err.message);
        return false;
    }
};

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
                .populate('alumni', 'name username collegeEmail currentCompany jobRole linkedIn')
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

        let shouldSendEmail = false;
        let emailStudentId = null;
        let emailAlumniUser = null;

        // Authorization and logic based on role
        if (req.user.role === 'alumni') {
            // Case 1: Alumni accepting a student-initiated request (no alumni assigned yet)
            if (!request.alumni || request.alumni === null) {
                if (status === 'accepted') {
                    request.alumni = req.user._id;
                    request.status = 'accepted';
                    shouldSendEmail = true;
                    emailStudentId = request.student;
                    emailAlumniUser = req.user;
                } else if (status === 'rejected') {
                    request.status = 'rejected';
                }
            } else {
                // Case 2: Alumni updating a request they are already assigned to
                if (request.alumni.toString() !== req.user._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to update this request'
                    });
                }
                if (status === 'accepted' && request.status !== 'accepted') {
                    request.status = 'accepted';
                    shouldSendEmail = true;
                    emailStudentId = request.student;
                    emailAlumniUser = req.user;
                } else {
                    request.status = status;
                }
            }
        } else if (req.user.role === 'student') {
            // Case 3: Student accepting an alumni-initiated request
            if (request.student.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this request'
                });
            }
            if (status === 'accepted' && request.status !== 'accepted') {
                request.status = 'accepted';
                // Email the student (themselves) to confirm
                shouldSendEmail = true;
                emailStudentId = req.user._id;
                // Fetch the alumni for name
                emailAlumniUser = await User.findById(request.alumni).select('name').lean();
            } else {
                request.status = status;
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Invalid role for this action'
            });
        }

        // Send acceptance email + mark flag
        if (shouldSendEmail && emailStudentId && emailAlumniUser) {
            const student = await User.findById(emailStudentId)
                .select('name collegeEmail')
                .lean();

            if (student) {
                const recipientEmail = student.collegeEmail;
                const alumniName = emailAlumniUser.name || 'Your Mentor';
                const emailSent = await sendMentorshipAcceptanceEmail(
                    recipientEmail,
                    student.name,
                    alumniName,
                    request.domain,
                    request._id.toString()
                );

                // Set flag regardless of email success so dev environments work too
                request.emailSentToStudent = emailSent;
                if (emailSent) request.emailSentAt = new Date();

                console.log(`[MENTORSHIP] Acceptance email ${emailSent ? 'sent' : 'skipped (not configured)'} for request ${id}`);
            }
        }

        await request.save();

        res.status(200).json({
            success: true,
            message: `Mentorship request ${status} successfully`,
            emailSentToStudent: request.emailSentToStudent,
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
