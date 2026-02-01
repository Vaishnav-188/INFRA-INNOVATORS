import Job from '../models/Job.js';

// @desc    Get all jobs (All roles can view)
// @route   GET /api/jobs
// @access  Protected
export const getAllJobs = async (req, res) => {
    try {
        const { status, location, jobType, search } = req.query;

        // Build query
        const query = {};

        if (status) {
            query.status = status;
        } else {
            query.status = 'active'; // Default to active jobs
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (jobType) {
            query.jobType = jobType;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const jobs = await Job.find(query)
            .populate('postedBy', 'name role currentCompany')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching jobs',
            error: error.message
        });
    }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Protected
export const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('postedBy', 'name role currentCompany collegeEmail');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.status(200).json({
            success: true,
            job
        });
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching job',
            error: error.message
        });
    }
};

// @desc    Create new job (Alumni only)
// @route   POST /api/jobs
// @access  Protected - Alumni & Admin
export const createJob = async (req, res) => {
    try {
        const {
            title,
            company,
            companyWebsiteURL,
            description,
            location,
            jobType,
            salary,
            experienceRequired,
            skills,
            deadline
        } = req.body;

        // Validation
        if (!title || !company || !companyWebsiteURL || !description || !location) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Create job
        const job = await Job.create({
            title,
            company,
            companyWebsiteURL,
            description,
            location,
            jobType,
            salary,
            experienceRequired,
            skills,
            deadline,
            postedBy: req.user._id
        });

        const populatedJob = await Job.findById(job._id)
            .populate('postedBy', 'name role currentCompany');

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job: populatedJob
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating job',
            error: error.message
        });
    }
};

// @desc    Delete job (Alumni can delete only their own, Admin can delete any)
// @route   DELETE /api/jobs/:id
// @access  Protected - Alumni & Admin
export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check ownership - Alumni can only delete their own jobs
        if (req.user.role === 'alumni' && job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete jobs posted by you'
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting job',
            error: error.message
        });
    }
};

// @desc    Update job status
// @route   PATCH /api/jobs/:id/status
// @access  Protected - Alumni (own jobs) & Admin
export const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check ownership
        if (req.user.role === 'alumni' && job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own jobs'
            });
        }

        job.status = status;
        await job.save();

        res.status(200).json({
            success: true,
            message: 'Job status updated successfully',
            data: job
        });
    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating job status',
            error: error.message
        });
    }
};

// @desc    Apply for job - Redirect to company website (Students only)
// @route   GET /api/jobs/:id/apply
// @access  Protected - Students
export const applyForJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications'
            });
        }

        // Redirect to company website
        res.redirect(job.companyWebsiteURL);
    } catch (error) {
        console.error('Error applying for job:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing application',
            error: error.message
        });
    }
};
