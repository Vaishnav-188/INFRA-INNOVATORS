import Connection from '../models/Connection.js';
import User from '../models/User.js';

// Get matching alumni based on student's interests
export const getMatchingAlumni = async (req, res) => {
    try {
        const userId = req.user._id;
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { interests, domain } = req.query;

        // Parse search interests from query or use student's profile
        const searchTerms = interests ?
            interests.split(',').map(i => i.trim().toLowerCase()).filter(Boolean) :
            [];

        // Build search query
        let query = {
            role: 'alumni',
            isVerified: true  // Only show verified alumni
        };

        // If domain or interests specified, add search filters
        if (domain || searchTerms.length > 0) {
            const searchConditions = [];

            if (searchTerms.length > 0) {
                // Search in skills array
                searchConditions.push({
                    skills: {
                        $in: searchTerms.map(term => new RegExp(term, 'i'))
                    }
                });

                // Search in interests array
                searchConditions.push({
                    interests: {
                        $in: searchTerms.map(term => new RegExp(term, 'i'))
                    }
                });

                // Search in job role
                searchConditions.push({
                    jobRole: {
                        $in: searchTerms.map(term => new RegExp(term, 'i'))
                    }
                });

                // Search in current company
                searchConditions.push({
                    currentCompany: {
                        $in: searchTerms.map(term => new RegExp(term, 'i'))
                    }
                });
            }

            if (domain) {
                // Match domain in department or interests
                searchConditions.push({ department: new RegExp(domain, 'i') });
                searchConditions.push({ interests: new RegExp(domain, 'i') });
            }

            if (searchConditions.length > 0) {
                query.$or = searchConditions;
            }
        }

        // Find matching alumni
        const matchingAlumni = await User.find(query)
            .select('-password -__v')
            .lean();

        // Calculate match score for each alumni
        const alumniWithScores = matchingAlumni.map(alumni => {
            let score = 0;
            const matchingSkills = [];
            const matchingInterests = [];

            // If search terms exist, calculate match score
            if (searchTerms.length > 0) {
                // Match skills
                (alumni.skills || []).forEach(skill => {
                    searchTerms.forEach(term => {
                        if (skill.toLowerCase().includes(term)) {
                            score += 15;
                            if (!matchingSkills.includes(skill)) {
                                matchingSkills.push(skill);
                            }
                        }
                    });
                });

                // Match interests
                (alumni.interests || []).forEach(interest => {
                    searchTerms.forEach(term => {
                        if (interest.toLowerCase().includes(term)) {
                            score += 10;
                            if (!matchingInterests.includes(interest)) {
                                matchingInterests.push(interest);
                            }
                        }
                    });
                });

                // Match job role
                if (alumni.jobRole) {
                    searchTerms.forEach(term => {
                        if (alumni.jobRole.toLowerCase().includes(term)) {
                            score += 20;
                        }
                    });
                }

                // Match department/domain
                if (domain && alumni.department) {
                    if (alumni.department.toLowerCase().includes(domain.toLowerCase())) {
                        score += 25;
                    }
                }
            } else {
                // If no search, give all alumni a base score
                score = 50;
            }

            return {
                _id: alumni._id,
                name: alumni.name,
                email: alumni.email,
                currentCompany: alumni.currentCompany || 'N/A',
                jobRole: alumni.jobRole || 'Alumni',
                location: alumni.location || 'Remote',
                department: alumni.department,
                graduationYear: alumni.graduationYear,
                skills: alumni.skills || [],
                interests: alumni.interests || [],
                linkedIn: alumni.linkedIn,
                github: alumni.github,
                bio: alumni.bio,
                isVerified: alumni.isVerified,
                matchScore: Math.min(score, 100),  // Cap at 100%
                matchingSkills,
                matchingInterests
            };
        });

        // Sort by match score (highest first)
        alumniWithScores.sort((a, b) => b.matchScore - a.matchScore);

        res.json({
            success: true,
            count: alumniWithScores.length,
            alumni: alumniWithScores,
            searchCriteria: {
                interests: searchTerms,
                domain: domain || 'All'
            }
        });
    } catch (error) {
        console.error('Error getting matching alumni:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
};

// Create connection request
export const createConnection = async (req, res) => {
    try {
        const studentId = req.user._id;
        const { alumniId, message, interests } = req.body;

        // Check if connection already exists
        const existingConnection = await Connection.findOne({
            student: studentId,
            alumni: alumniId
        });

        if (existingConnection) {
            return res.status(400).json({ error: 'Connection request already exists' });
        }

        // Get alumni to calculate match score
        const alumni = await User.findById(alumniId);
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(404).json({ error: 'Alumni not found' });
        }

        // Calculate match score
        let matchScore = 0;
        const studentInterests = interests || [];

        studentInterests.forEach(interest => {
            if (alumni.skills?.includes(interest)) matchScore += 10;
            if (alumni.interests?.includes(interest)) matchScore += 5;
        });

        const connection = await Connection.create({
            student: studentId,
            alumni: alumniId,
            message,
            studentInterests,
            matchScore,
            status: 'pending'
        });

        const populatedConnection = await Connection.findById(connection._id)
            .populate('student', 'name collegeEmail department yearOfStudy')
            .populate('alumni', 'name currentCompany jobRole domain');

        res.status(201).json({
            success: true,
            connection: populatedConnection
        });
    } catch (error) {
        console.error('Error creating connection:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get student's connections
export const getMyConnections = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        const query = req.user.role === 'student'
            ? { student: userId }
            : { alumni: userId };

        if (status) {
            query.status = status;
        }

        const connections = await Connection.find(query)
            .populate('student', 'name collegeEmail department yearOfStudy interests')
            .populate('alumni', 'name currentCompany jobRole domain skills location')
            .sort('-createdAt');

        res.json({
            success: true,
            connections
        });
    } catch (error) {
        console.error('Error getting connections:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update connection status (for alumni)
export const updateConnectionStatus = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { status } = req.body;
        const alumniId = req.user._id;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const connection = await Connection.findOne({
            _id: connectionId,
            alumni: alumniId
        });

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        connection.status = status;
        connection.updatedAt = Date.now();
        await connection.save();

        const updatedConnection = await Connection.findById(connectionId)
            .populate('student', 'name collegeEmail department yearOfStudy')
            .populate('alumni', 'name currentCompany jobRole domain');

        res.json({
            success: true,
            connection: updatedConnection
        });
    } catch (error) {
        console.error('Error updating connection:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get connection statistics
export const getConnectionStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const isStudent = req.user.role === 'student';

        const query = isStudent ? { student: userId } : { alumni: userId };

        const [total, pending, accepted, rejected] = await Promise.all([
            Connection.countDocuments(query),
            Connection.countDocuments({ ...query, status: 'pending' }),
            Connection.countDocuments({ ...query, status: 'accepted' }),
            Connection.countDocuments({ ...query, status: 'rejected' })
        ]);

        res.json({
            success: true,
            stats: {
                total,
                pending,
                accepted,
                rejected
            }
        });
    } catch (error) {
        console.error('Error getting connection stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
