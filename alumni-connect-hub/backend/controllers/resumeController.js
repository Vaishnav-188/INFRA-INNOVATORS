import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { spawn } from 'child_process';
import ResumeApplication from '../models/ResumeApplication.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Email transporter ────────────────────────────────────────────────────────
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// ─── Send shortlist email ─────────────────────────────────────────────────────
const sendShortlistEmail = async (studentEmail, studentName, jobTitle, company, interviewDate, alumniEmail, alumniName) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('[EMAIL] No email credentials configured — skipping email send');
            return false;
        }
        const transporter = createTransporter();
        const dateStr = interviewDate
            ? new Date(interviewDate).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : 'To be announced';

        await transporter.sendMail({
            from: `"${alumniName} via AlumniHub" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            replyTo: alumniEmail, // Replies go to the Alumnus directly
            subject: `🎉 Congratulations! Your resume has been shortlisted — ${jobTitle} at ${company}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
                    <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); border-radius: 20px; padding: 40px; text-align: center; margin-bottom: 30px;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 900;">🎉 CONGRATULATIONS!</h1>
                        <p style="color: rgba(255,255,255,0.85); margin-top: 10px; font-size: 16px;">Your resume has been shortlisted!</p>
                    </div>
                    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                        <p style="font-size: 16px; color: #1e293b; margin-bottom: 20px;">Dear <strong>${studentName}</strong>,</p>
                        <p style="color: #475569; line-height: 1.7;">We are thrilled to inform you that your resume has been <strong style="color: #16a34a;">shortlisted</strong> for the position of:</p>
                        <div style="background: #f0f9ff; border-left: 4px solid #1e40af; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 20px; font-weight: 800; color: #1e40af;">${jobTitle}</p>
                            <p style="margin: 4px 0 0; color: #64748b; font-weight: 600;">${company}</p>
                        </div>
                        <p style="color: #475569; line-height: 1.7;">You are invited for an <strong>in-person interview</strong> at our office:</p>
                        <div style="background: linear-gradient(135deg, #fef3c7, #fef9ee); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">📅 Interview Date & Time</p>
                            <p style="margin: 8px 0 0; font-size: 22px; font-weight: 900; color: #1e293b;">${dateStr}</p>
                        </div>
                        <p style="color: #475569; line-height: 1.7;">Please make sure to carry a printed copy of your resume and any supporting documents. We look forward to meeting you!</p>
                        
                        <div style="margin-top: 25px; padding: 15px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 13px; color: #64748b;">Best Regards,</p>
                            <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #1e293b;">${alumniName}</p>
                            <p style="margin: 0; font-size: 13px; color: #3b82f6;">${alumniEmail}</p>
                        </div>

                        <p style="color: #64748b; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            This email was sent via AlumniHub. You can reply to this email to contact the recruiter directly.
                        </p>
                    </div>
                </div>
            `
        });
        console.log(`[EMAIL] Shortlist email sent to ${studentEmail}`);
        return true;
    } catch (err) {
        console.error('[EMAIL] Failed to send shortlist email:', err.message);
        return false;
    }
};

// ─── STUDENT: Upload resume ───────────────────────────────────────────────────
// POST /api/resume/:jobId/apply
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
        }

        const job = await Job.findById(req.params.jobId);
        if (!job) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Extract text from PDF
        let resumeText = '';
        try {
            const pdfBuffer = fs.readFileSync(req.file.path);
            const parsed = await pdfParse(pdfBuffer);
            resumeText = parsed.text || '';
        } catch (pdfErr) {
            console.error('[PDF] Failed to parse PDF:', pdfErr.message);
            resumeText = '';
        }

        // ── Parse studentSkills — multer sends array fields as 'studentSkills[]' ──
        // Support both 'studentSkills' and 'studentSkills[]', string or array
        let rawSkills = req.body['studentSkills[]'] || req.body.studentSkills || [];
        if (typeof rawSkills === 'string') {
            // Could be comma-separated or JSON array
            try { rawSkills = JSON.parse(rawSkills); }
            catch { rawSkills = rawSkills.split(',').map(s => s.trim()).filter(Boolean); }
        }
        if (!Array.isArray(rawSkills)) rawSkills = [rawSkills].filter(Boolean);
        const studentSkills = rawSkills.filter(s => typeof s === 'string' && s.trim());

        const experience = req.body.experience || 'Fresher';
        const projects = req.body.projects || '';

        console.log('[RESUME] Student skills received:', studentSkills);
        console.log('[RESUME] Projects:', projects.slice(0, 100));

        // Check if already applied
        const existing = await ResumeApplication.findOne({
            job: req.params.jobId,
            student: req.user._id
        });

        let application;
        if (existing) {
            // Update existing application (re-apply) — always save fresh data
            if (existing.resumePath && fs.existsSync(existing.resumePath)) {
                fs.unlinkSync(existing.resumePath);
            }
            existing.resumePath = req.file.path;
            existing.resumeText = resumeText;
            existing.studentSkills = studentSkills;   // ← updated skills
            existing.experience = experience;        // ← updated experience
            existing.projects = projects;          // ← updated projects
            existing.status = 'pending';
            existing.screened = false;
            existing.aiScore = null;
            existing.aiSummary = '';
            existing.matchedSkills = [];
            existing.missingSkills = [];
            await existing.save();
            application = existing;
        } else {
            application = await ResumeApplication.create({
                job: req.params.jobId,
                student: req.user._id,
                resumePath: req.file.path,
                resumeText,
                studentSkills,
                experience,
                projects,
                status: 'pending'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully. Alumni will review and screen your application soon.',
            applicationId: application._id
        });
    } catch (err) {
        console.error('[RESUME] Upload error:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// ─── AI Screening (Gemini-powered) ───────────────────────────────────────────
const screenResumeWithAI = async (applicationId, resumeText, job, candidateInfo) => {
    try {
        const application = await ResumeApplication.findById(applicationId);
        if (!application) return { error: 'Application not found' };

        application.status = 'screening';
        await application.save();

        const PYTHON_PATH = 'C:\\Users\\yoghe\\OneDrive\\Documents\\alumini\\venv\\Scripts\\python.exe';
        const SCRIPT_PATH = 'C:\\Users\\yoghe\\OneDrive\\Documents\\alumini\\ai_model.py';

        // ── Build the full payload that Gemini will receive ──────────────────
        // This includes ALL student personal details + job requirements
        const payload = JSON.stringify({
            // Student personal details
            studentName: candidateInfo.user?.name || 'Student',
            studentEmail: candidateInfo.user?.collegeEmail || '',
            department: candidateInfo.user?.department || 'Not specified',
            experience: candidateInfo.experience || 'Fresher',

            // Student's tech stack + work
            studentSkills: candidateInfo.studentSkills || [],
            projects: candidateInfo.projects || '',
            resumeText: resumeText || '',   // already extracted by Node
            resumePath: application.resumePath || '',   // Python will extract if resumeText empty

            // Job requirements (alumni's posting)
            jobRole: job.title,
            jobDesc: job.description,
            jobCompany: job.company,
            reqSkills: job.skills || [],
        });

        console.log('[AI] Starting Gemini screening for:', candidateInfo.user?.name);
        console.log('[AI] Job:', job.title, '| Required:', job.skills);

        const pythonProcess = spawn(PYTHON_PATH, [SCRIPT_PATH, payload], {
            env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY || '' }
        });

        let stdoutData = '';
        let stderrData = '';
        pythonProcess.stdout.on('data', (d) => { stdoutData += d.toString(); });
        pythonProcess.stderr.on('data', (d) => { stderrData += d.toString(); });

        // ── Promise with 60s timeout ─────────────────────────────────────────
        const aiData = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('AI screening timed out after 60s'));
            }, 60000);

            pythonProcess.on('close', (code) => {
                clearTimeout(timer);
                // Find the last valid JSON line in stdout
                const lines = stdoutData.trim().split('\n').reverse();
                let parsed = null;
                for (const line of lines) {
                    const t = line.trim();
                    if (t.startsWith('{')) {
                        try { parsed = JSON.parse(t); break; } catch (_) { }
                    }
                }
                if (parsed) {
                    console.log('[AI] Gemini result:', JSON.stringify(parsed));
                    resolve(parsed);
                } else {
                    console.error('[AI] stderr:', stderrData);
                    reject(new Error('No valid JSON from AI script. stdout: ' + stdoutData.slice(0, 300)));
                }
            });
        });

        // ── Save AI results to database ──────────────────────────────────────
        // Status comes directly from AI (threshold = 70% match)
        const isShortlisted = aiData.status === 'Shortlisted';

        application.aiScore = aiData.match_score;
        application.matchedSkills = aiData.matched_skills || [];
        application.missingSkills = aiData.missing_skills || [];
        application.suggestions = aiData.suggestions || '';
        application.status = isShortlisted ? 'shortlisted' : 'rejected';
        application.aiSummary = isShortlisted
            ? `🎉 Congratulations! You have been shortlisted for ${job.title} at ${job.company}.`
            : `Your application for ${job.title} was not shortlisted. ${aiData.suggestions || 'Please update your skills and try again.'}`;
        application.screened = true;
        await application.save();

        // ── Auto-send congratulations email if Shortlisted ───────────────────
        if (isShortlisted && !application.emailSent) {
            const recruiter = await User.findById(job.postedBy);
            const sent = await sendShortlistEmail(
                candidateInfo.user.collegeEmail,
                candidateInfo.user.name,
                job.title,
                job.company,
                null,
                recruiter?.collegeEmail || recruiter?.email,
                recruiter?.name || 'Recruiter'
            );
            if (sent) {
                application.emailSent = true;
                await application.save();
            }
        }

        return aiData;

    } catch (err) {
        console.error('[AI] screenResumeWithAI error:', err.message);
        try {
            const app = await ResumeApplication.findById(applicationId);
            if (app) { app.status = 'pending'; app.screened = false; await app.save(); }
        } catch (_) { }
        return { error: err.message };
    }
};

// ─── Fallback keyword-based scoring (when AI model offline) ──────────────────
const basicKeywordScreen = (resumeText, job) => {
    const text = resumeText.toLowerCase();
    const jobWords = [
        ...job.title.toLowerCase().split(/\s+/),
        ...(job.skills || []).map(s => s.toLowerCase()),
        ...(job.description || '').toLowerCase().split(/\s+/).slice(0, 30)
    ];
    const matches = jobWords.filter(w => w.length > 3 && text.includes(w));
    const score = Math.min(100, Math.round((matches.length / Math.max(jobWords.length, 1)) * 100));
    const fallbackSummary = score >= 60
        ? `Resume matches ${matches.length} key terms from the job description. Candidate appears suitable.`
        : `Resume matches only ${matches.length} key terms. May not meet requirements.`;
    return { fallbackScore: score, fallbackSummary };
};

// ─── ALUMNI: Get all applications for a job ───────────────────────────────────
// GET /api/resume/:jobId/applications
export const getJobApplications = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        // Any alumni or admin can view applications (they can see but only the job-poster can shortlist/reject)
        // Students cannot access this endpoint at all (handled by route middleware)

        const applications = await ResumeApplication.find({ job: req.params.jobId })
            .populate('student', 'name username collegeEmail department batch yearOfStudy')
            .select('student status aiScore aiSummary matchedSkills missingSkills suggestions studentSkills experience projects resumePath screened emailSent interviewDate createdAt')
            .sort({ aiScore: -1, createdAt: -1 });

        res.json({ success: true, applications, job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ALUMNI: Download student resume ─────────────────────────────────────────
// GET /api/resume/:applicationId/download
export const downloadResume = async (req, res) => {
    try {
        const application = await ResumeApplication.findById(req.params.applicationId)
            .populate('job', 'postedBy');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Only the alumni who posted the job (or admin) can download
        if (req.user.role === 'alumni' &&
            application.job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const resumePath = application.resumePath;
        if (!resumePath || !fs.existsSync(resumePath)) {
            return res.status(404).json({ success: false, message: 'Resume file not found' });
        }

        const fileName = `resume_${application._id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        fs.createReadStream(resumePath).pipe(res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ALUMNI: Shortlist/reject + set interview date ───────────────────────────
// PATCH /api/resume/:applicationId/shortlist
export const updateApplicationStatus = async (req, res) => {
    try {
        const { status, interviewDate } = req.body;

        if (!['shortlisted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const application = await ResumeApplication.findById(req.params.applicationId)
            .populate('student', 'name collegeEmail')
            .populate('job', 'title company postedBy');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Only the alumni who posted the job can update
        if (req.user.role === 'alumni' &&
            application.job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        application.status = status;
        if (interviewDate) application.interviewDate = new Date(interviewDate);
        await application.save();

        // Get Recruiter (Alumnus) details
        const recruiter = await User.findById(application.job.postedBy);

        // Send email if shortlisted
        if (status === 'shortlisted' && !application.emailSent) {
            const emailSent = await sendShortlistEmail(
                application.student.collegeEmail,
                application.student.name,
                application.job.title,
                application.job.company,
                application.interviewDate,
                recruiter?.collegeEmail || recruiter?.email, // Alumnus Email
                recruiter?.name || 'Recruiter'                // Alumnus Name
            );
            if (emailSent) {
                application.emailSent = true;
                await application.save();
            }
        }

        res.json({
            success: true,
            message: status === 'shortlisted'
                ? '🎉 Student shortlisted! Email notification sent.'
                : 'Application rejected.',
            application
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ALUMNI: Trigger AI screening ─────────────────────────────────────────────
// POST /api/resume/:applicationId/screen
export const runAIScreening = async (req, res) => {
    try {
        const application = await ResumeApplication.findById(req.params.applicationId)
            .populate('student', 'name collegeEmail')
            .populate('job', 'title description skills postedBy company');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Only the alumni who posted the job can update
        if (req.user.role === 'alumni' &&
            application.job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const aiData = await screenResumeWithAI(application._id, application.resumeText, application.job, {
            studentSkills: application.studentSkills,
            experience: application.experience,
            projects: application.projects,
            user: application.student
        });

        res.json({
            success: true,
            message: 'AI screening completed',
            aiData
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── STUDENT: Check their application status for a job ───────────────────────
// GET /api/resume/:jobId/my-status
export const getMyApplicationStatus = async (req, res) => {
    try {
        const application = await ResumeApplication.findOne({
            job: req.params.jobId,
            student: req.user._id
        }).populate('job', 'title company');

        if (!application) {
            return res.json({ success: true, applied: false });
        }

        res.json({
            success: true,
            applied: true,
            status: application.status,
            aiScore: application.aiScore,
            aiSummary: application.aiSummary,
            interviewDate: application.interviewDate,
            screened: application.screened
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── STUDENT: Get ALL their applications (any status) ────────────────────────
// GET /api/resume/my-applications
export const getMyApplications = async (req, res) => {
    try {
        const applications = await ResumeApplication.find({
            student: req.user._id
        })
            .populate('job', 'title company location')
            .sort({ createdAt: -1 });

        res.json({ success: true, applications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── STUDENT: Get ALL their shortlisted notifications ────────────────────────
// GET /api/resume/my-notifications
export const getMyShortlistNotifications = async (req, res) => {
    try {
        const applications = await ResumeApplication.find({
            student: req.user._id,
            status: 'shortlisted'
        }).populate('job', 'title company location');

        res.json({ success: true, shortlisted: applications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
