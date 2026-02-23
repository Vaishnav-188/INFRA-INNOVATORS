// NLP Service for Intent Classification and Entity Extraction
// Uses pattern matching and keyword analysis
// Can be enhanced with ML models like TensorFlow.js or external APIs

const intents = {
    SEARCH_ALUMNI: {
        keywords: ['alumni', 'alumnus', 'graduate', 'graduated', 'working', 'works at', 'find', 'search'],
        patterns: [
            /alumni.*working.*as/i,
            /find.*alumni/i,
            /any.*alumni/i,
            /alumni.*in.*company/i,
            /graduated.*working/i
        ]
    },
    SEARCH_JOBS: {
        keywords: ['job', 'jobs', 'position', 'opening', 'hiring', 'career', 'opportunity', 'vacancies'],
        patterns: [
            /job.*opening/i,
            /any.*jobs/i,
            /hiring.*for/i,
            /career.*opportunity/i
        ]
    },
    SEARCH_EVENTS: {
        keywords: ['event', 'events', 'webinar', 'workshop', 'meetup', 'conference', 'networking'],
        patterns: [
            /upcoming.*event/i,
            /any.*event/i,
            /when.*event/i,
            /event.*happening/i
        ]
    },
    MENTORSHIP_REQUEST: {
        keywords: ['mentor', 'mentorship', 'guidance', 'advice', 'help', 'guide', 'learn from'],
        patterns: [
            /need.*mentor/i,
            /looking.*for.*guidance/i,
            /want.*mentorship/i,
            /help.*me.*with/i
        ]
    },
    DONATION_INFO: {
        keywords: ['donate', 'donation', 'contribute', 'fund', 'support', 'give'],
        patterns: [
            /how.*donate/i,
            /donation.*process/i,
            /want.*to.*donate/i
        ]
    },
    GREETING: {
        keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
        patterns: [
            /^(hi|hello|hey)/i,
            /good\s+(morning|afternoon|evening)/i
        ]
    },
    GENERAL_HELP: {
        keywords: ['help', 'assist', 'support', 'how to', 'what is', 'explain'],
        patterns: [
            /how.*do/i,
            /what.*is/i,
            /can.*you.*help/i
        ]
    }
};

// Entity extraction patterns
const entityPatterns = {
    domain: {
        keywords: [
            'Software Engineering', 'Data Science', 'Machine Learning', 'AI',
            'Web Development', 'Mobile Development', 'DevOps', 'Cloud Computing',
            'Cybersecurity', 'UI/UX', 'Product Management', 'Marketing',
            'Finance', 'Consulting', 'Mechanical Engineering', 'Civil Engineering',
            'Electrical Engineering', 'Chemical Engineering'
        ],
        patterns: /\b(software|data|machine learning|AI|web|mobile|devops|cloud|cyber|ui\/ux|product|marketing|finance|consulting|mechanical|civil|electrical|chemical)\b/gi
    },
    location: {
        cities: [
            'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune',
            'Kolkata', 'Ahmedabad', 'Noida', 'Gurgaon', 'California', 'New York',
            'London', 'Singapore', 'Dubai', 'Seattle', 'Boston', 'Austin'
        ],
        patterns: /\b(in|at|from|located)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g
    },
    role: {
        titles: [
            'Software Engineer', 'Senior Developer', 'Tech Lead', 'Manager',
            'Data Scientist', 'ML Engineer', 'Product Manager', 'Designer',
            'Analyst', 'Consultant', 'Director', 'VP', 'CTO', 'CEO'
        ],
        patterns: /\b(engineer|developer|scientist|manager|lead|director|analyst|designer|consultant)\b/gi
    },
    skills: {
        technical: [
            'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'MongoDB',
            'SQL', 'AWS', 'Docker', 'Kubernetes', 'TensorFlow', 'PyTorch'
        ],
        patterns: /\b(javascript|python|java|react|node\.?js|mongodb|sql|aws|docker|kubernetes|tensorflow|pytorch)\b/gi
    },
    company: {
        patterns: /\b(Google|Microsoft|Amazon|Meta|Apple|Netflix|Tesla|Uber|Adobe|Oracle|IBM|Intel)\b/gi
    }
};

/**
 * Classify user intent from message
 * @param {string} message - User message
 * @returns {Object} { intent: string, confidence: number }
 */
export const classifyIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    let bestMatch = { intent: 'other', confidence: 0 };

    for (const [intentName, intentData] of Object.entries(intents)) {
        let score = 0;

        // Check keywords
        const keywordMatches = intentData.keywords.filter(keyword =>
            lowerMessage.includes(keyword.toLowerCase())
        ).length;
        score += keywordMatches * 10;

        // Check patterns
        const patternMatches = intentData.patterns.filter(pattern =>
            pattern.test(message)
        ).length;
        score += patternMatches * 20;

        if (score > bestMatch.confidence) {
            bestMatch = {
                intent: intentName.toLowerCase(),
                confidence: Math.min(score / 30, 1) // Normalize to 0-1
            };
        }
    }

    return bestMatch;
};

/**
 * Extract entities from user message
 * @param {string} message - User message
 * @returns {Object} Extracted entities
 */
export const extractEntities = (message) => {
    const entities = {
        domain: [],
        location: [],
        role: [],
        skills: [],
        company: []
    };

    // Extract domains
    const domainMatches = entityPatterns.domain.keywords.filter(keyword =>
        new RegExp(`\\b${keyword}\\b`, 'i').test(message)
    );
    entities.domain = [...new Set(domainMatches)]; // Remove duplicates

    // Extract locations
    const locationMatches = entityPatterns.location.cities.filter(city =>
        new RegExp(`\\b${city}\\b`, 'i').test(message)
    );
    entities.location = [...new Set(locationMatches)];

    // Extract roles
    const roleMatch = message.match(entityPatterns.role.patterns);
    if (roleMatch) {
        entities.role = [...new Set(roleMatch.map(r => r.trim()))];
    }

    // Extract skills
    const skillMatch = message.match(entityPatterns.skills.patterns);
    if (skillMatch) {
        entities.skills = [...new Set(skillMatch.map(s => s.trim()))];
    }

    // Extract companies
    const companyMatch = message.match(entityPatterns.company.patterns);
    if (companyMatch) {
        entities.company = [...new Set(companyMatch)];
    }

    return entities;
};

/**
 * Preprocess text for better NLP results
 * @param {string} text - Input text
 * @returns {string} Cleaned text
 */
export const preprocessText = (text) => {
    return text
        .trim()
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .replace(/[^\w\s.,?!-]/g, ''); // Remove special chars except basic punctuation
};

/**
 * Calculate similarity between student interests and alumni expertise
 * Uses Jaccard similarity on skills/domains
 * @param {Array} studentSkills - Student's skills
 * @param {Array} alumniSkills - Alumni's skills
 * @returns {number} Similarity score (0-100)
 */
export const calculateMatchScore = (studentSkills, alumniSkills) => {
    if (!studentSkills || !alumniSkills ||
        studentSkills.length === 0 || alumniSkills.length === 0) {
        return 0;
    }

    const studentSet = new Set(studentSkills.map(s => s.toLowerCase()));
    const alumniSet = new Set(alumniSkills.map(s => s.toLowerCase()));

    const intersection = new Set([...studentSet].filter(x => alumniSet.has(x)));
    const union = new Set([...studentSet, ...alumniSet]);

    const jaccardScore = intersection.size / union.size;
    return Math.round(jaccardScore * 100);
};

/**
 * Build MongoDB query from extracted entities
 * @param {string} intent - Classified intent
 * @param {Object} entities - Extracted entities
 * @returns {Object} MongoDB query object
 */
export const buildQuery = (intent, entities) => {
    const query = {};

    if (intent === 'search_alumni') {
        query.role = 'alumni';

        if (entities.domain && entities.domain.length > 0) {
            query.domain = { $in: entities.domain.map(d => new RegExp(d, 'i')) };
        }

        if (entities.location && entities.location.length > 0) {
            query.location = { $in: entities.location.map(l => new RegExp(l, 'i')) };
        }

        if (entities.company && entities.company.length > 0) {
            query.currentCompany = { $in: entities.company.map(c => new RegExp(c, 'i')) };
        }

        if (entities.role && entities.role.length > 0) {
            query.jobRole = { $in: entities.role.map(r => new RegExp(r, 'i')) };
        }
    }

    if (intent === 'search_jobs') {
        query.status = 'active';

        if (entities.location && entities.location.length > 0) {
            query.location = { $in: entities.location.map(l => new RegExp(l, 'i')) };
        }

        if (entities.role && entities.role.length > 0) {
            query.title = { $in: entities.role.map(r => new RegExp(r, 'i')) };
        }

        if (entities.company && entities.company.length > 0) {
            query.company = { $in: entities.company.map(c => new RegExp(c, 'i')) };
        }
    }

    if (intent === 'search_events') {
        query.status = { $in: ['upcoming', 'ongoing'] };

        if (entities.eventType && entities.eventType.length > 0) {
            query.eventType = { $in: entities.eventType };
        }
    }

    return query;
};

export default {
    classifyIntent,
    extractEntities,
    preprocessText,
    calculateMatchScore,
    buildQuery
};
