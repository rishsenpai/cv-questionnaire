const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
let pdfParse;
try {
    pdfParse = require('pdf-parse');
} catch (e) {
    console.log('pdf-parse not available, PDF parsing disabled');
    pdfParse = null;
}
require('dotenv').config();

const CV = require('./models/CV');
const Employer = require('./models/Employer');
const Vacancy = require('./models/Vacancy');
const EmployerToken = require('./models/EmployerToken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini for AI matching (FREE tier available)
const gemini = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection with caching for serverless
let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        if (process.env.MONGODB_URI) {
            cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
                bufferCommands: false,
                maxPoolSize: 10
            });
            console.log('MongoDB connected successfully');
            return cachedConnection;
        } else {
            console.log('No MONGODB_URI provided, running without database');
            return null;
        }
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        return null;
    }
};

// Connect on startup for local development
if (process.env.NODE_ENV !== 'production') {
    connectDB();
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));  // Increased for file uploads
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(express.static('.'));

// Admin authentication
const ADMIN_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const activeTokens = new Map();

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function validateToken(token) {
    const tokenData = activeTokens.get(token);
    if (!tokenData) return false;
    if (Date.now() > tokenData.expires) {
        activeTokens.delete(token);
        return false;
    }
    return true;
}

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return res.status(500).json({
            success: false,
            message: 'Admin password not configured'
        });
    }

    if (password === adminPassword) {
        const token = generateToken();
        activeTokens.set(token, { expires: Date.now() + ADMIN_TOKEN_EXPIRY });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Verify token endpoint
app.post('/api/admin/verify', (req, res) => {
    const { token } = req.body;
    if (validateToken(token)) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
});

// Admin middleware for protected routes
function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!validateToken(token)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
}

// Employer login endpoint - stores token in MongoDB for serverless compatibility
app.post('/api/employer/login', async (req, res) => {
    try {
        await connectDB();
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password required'
            });
        }

        const employer = await Employer.findOne({ username: username.toLowerCase(), isActive: true });
        if (!employer || !employer.checkPassword(password)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken();
        const expires = new Date(Date.now() + ADMIN_TOKEN_EXPIRY);

        // Store token in MongoDB instead of memory
        await EmployerToken.findOneAndUpdate(
            { employerId: employer._id },
            { token, employerId: employer._id, expires },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            token,
            employer: {
                companyName: employer.companyName,
                plan: employer.plan || 'basic'
            }
        });

    } catch (error) {
        console.error('Employer login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Verify employer token - fetch from MongoDB
app.post('/api/employer/verify', async (req, res) => {
    try {
        await connectDB();
        const { token } = req.body;

        const tokenData = await EmployerToken.findOne({ token, expires: { $gt: new Date() } });
        if (!tokenData) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const employer = await Employer.findById(tokenData.employerId);
        if (!employer || !employer.isActive) {
            await EmployerToken.deleteOne({ token });
            return res.status(401).json({ success: false, message: 'Account inactive' });
        }

        res.json({ success: true, plan: employer.plan || 'basic' });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

// Employer middleware - fetch token from MongoDB
async function requireEmployer(req, res, next) {
    try {
        await connectDB();
        const token = req.headers['x-employer-token'];

        const tokenData = await EmployerToken.findOne({ token, expires: { $gt: new Date() } });
        if (!tokenData) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const employer = await Employer.findById(tokenData.employerId);
        if (!employer || !employer.isActive) {
            await EmployerToken.deleteOne({ token });
            return res.status(401).json({ success: false, message: 'Account inactive' });
        }

        req.employer = {
            employerId: tokenData.employerId,
            plan: employer.plan || 'basic'
        };
        next();
    } catch (error) {
        console.error('Employer middleware error:', error);
        res.status(500).json({ success: false, message: 'Authentication error' });
    }
}

// Get CVs for employers (with filtering and hidden fields)
app.get('/api/employer/cvs', requireEmployer, async (req, res) => {
    try {
        await connectDB();

        const { search, jobTitle, location } = req.query;
        let query = {};

        // Build search query - search in fullText (contains all PDF content)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { fullText: searchRegex },  // Search entire PDF content
                { fullName: searchRegex },
                { jobTitle: searchRegex },
                { skills: searchRegex }
            ];
        }

        if (jobTitle) {
            query.jobTitle = new RegExp(jobTitle, 'i');
        }

        if (location) {
            query.location = new RegExp(location, 'i');
        }

        const cvs = await CV.find(query).select('-fileData').sort({ createdAt: -1 });

        // Access based on plan: basic = hidden, advanced/premium = full access
        const plan = req.employer.plan || 'basic';
        const hasFullAccess = plan === 'advanced' || plan === 'premium';

        const sanitizedCVs = cvs.map(cv => {
            const cvObj = cv.toObject();
            if (!hasFullAccess) {
                // Basic plan: hide contact info, name details, and work history
                cvObj.email = '••••••@••••••';
                cvObj.phone = '•••••••••••';
                cvObj.fullName = cvObj.fullName.split(' ')[0] + ' ••••••';
                cvObj.location = cvObj.location ? cvObj.location.split(',')[0] + ', ••••••' : null;
                cvObj.experience = cvObj.experience ? '🔒 Upgrade naar Advanced om werkervaring te zien' : null;
            }
            return cvObj;
        });

        res.json({
            success: true,
            count: sanitizedCVs.length,
            plan,
            data: sanitizedCVs
        });

    } catch (error) {
        console.error('Error fetching CVs for employer:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch CVs' });
    }
});

// Download CV for employers (only for advanced/premium plans)
app.get('/api/employer/cvs/:id/download', requireEmployer, async (req, res) => {
    try {
        const plan = req.employer.plan || 'basic';
        if (plan === 'basic') {
            return res.status(403).json({
                success: false,
                message: 'Upgrade naar Advanced of Premium om CVs te downloaden'
            });
        }

        await connectDB();
        const cv = await CV.findById(req.params.id);

        if (!cv) {
            return res.status(404).json({ success: false, message: 'CV not found' });
        }

        if (!cv.fileData) {
            return res.status(404).json({ success: false, message: 'No file attached' });
        }

        res.json({
            success: true,
            data: {
                fileName: cv.fileName,
                fileType: cv.fileType,
                fileData: cv.fileData
            }
        });

    } catch (error) {
        console.error('Error downloading CV:', error);
        res.status(500).json({ success: false, message: 'Failed to download CV' });
    }
});

// === ADMIN: Employer Management ===

// Get all employers (admin only)
app.get('/api/admin/employers', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        const employers = await Employer.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: employers });
    } catch (error) {
        console.error('Error fetching employers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employers' });
    }
});

// Create employer (admin only)
app.post('/api/admin/employers', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        const { username, password, companyName, contactEmail, plan, isActive } = req.body;

        if (!username || !password || !companyName) {
            return res.status(400).json({
                success: false,
                message: 'Username, password and company name required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if username exists
        const existing = await Employer.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const employer = new Employer({
            username,
            password,
            companyName,
            contactEmail,
            plan: plan || 'basic',
            isActive: isActive !== false // Default to true unless explicitly set to false
        });

        await employer.save();
        res.json({
            success: true,
            message: 'Employer created',
            data: { _id: employer._id, username: employer.username, companyName: employer.companyName, plan: employer.plan }
        });

    } catch (error) {
        console.error('Error creating employer:', error);
        res.status(500).json({
            success: false,
            message: error.code === 11000 ? 'Username already exists' : `Failed to create employer: ${error.message}`
        });
    }
});

// Update employer (admin only)
app.put('/api/admin/employers/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        const { companyName, contactEmail, plan, isActive, password } = req.body;

        const employer = await Employer.findById(req.params.id);
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer not found' });
        }

        if (companyName) employer.companyName = companyName;
        if (contactEmail !== undefined) employer.contactEmail = contactEmail;
        if (plan !== undefined) employer.plan = plan;
        if (isActive !== undefined) employer.isActive = isActive;
        if (password) employer.password = password;

        await employer.save();
        res.json({ success: true, message: 'Employer updated' });

    } catch (error) {
        console.error('Error updating employer:', error);
        res.status(500).json({ success: false, message: 'Failed to update employer' });
    }
});

// Delete employer (admin only)
app.delete('/api/admin/employers/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();
        await Employer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Employer deleted' });
    } catch (error) {
        console.error('Error deleting employer:', error);
        res.status(500).json({ success: false, message: 'Failed to delete employer' });
    }
});

// === PREMIUM: Vacancy Management ===

// Get vacancies for employer (premium only)
app.get('/api/employer/vacancies', requireEmployer, async (req, res) => {
    try {
        const plan = req.employer.plan || 'basic';
        if (plan !== 'premium') {
            return res.status(403).json({
                success: false,
                message: 'Upgrade naar Premium voor vacature matching'
            });
        }

        await connectDB();
        const vacancies = await Vacancy.find({ employerId: req.employer.employerId, isActive: true })
            .select('-fileData')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: vacancies });
    } catch (error) {
        console.error('Error fetching vacancies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch vacancies' });
    }
});

// Create vacancy (premium only)
app.post('/api/employer/vacancies', requireEmployer, async (req, res) => {
    try {
        const plan = req.employer.plan || 'basic';
        if (plan !== 'premium') {
            return res.status(403).json({
                success: false,
                message: 'Upgrade naar Premium voor vacature matching'
            });
        }

        await connectDB();
        const { title, description, location, requirements, fullText, fileName, fileData, fileType } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Vacature titel is verplicht'
            });
        }

        const vacancy = new Vacancy({
            employerId: req.employer.employerId,
            title,
            description,
            location,
            requirements,
            fullText: fullText || `${title} ${description || ''} ${requirements || ''}`,
            fileName,
            fileData,
            fileType
        });

        const savedVacancy = await vacancy.save();
        res.json({
            success: true,
            message: 'Vacature aangemaakt',
            data: { _id: savedVacancy._id, title: savedVacancy.title }
        });

    } catch (error) {
        console.error('Error creating vacancy:', error);
        res.status(500).json({ success: false, message: 'Failed to create vacancy' });
    }
});

// Delete vacancy (premium only)
app.delete('/api/employer/vacancies/:id', requireEmployer, async (req, res) => {
    try {
        const plan = req.employer.plan || 'basic';
        if (plan !== 'premium') {
            return res.status(403).json({
                success: false,
                message: 'Upgrade naar Premium voor vacature matching'
            });
        }

        await connectDB();
        const vacancy = await Vacancy.findOneAndDelete({
            _id: req.params.id,
            employerId: req.employer.employerId
        });

        if (!vacancy) {
            return res.status(404).json({ success: false, message: 'Vacature niet gevonden' });
        }

        res.json({ success: true, message: 'Vacature verwijderd' });
    } catch (error) {
        console.error('Error deleting vacancy:', error);
        res.status(500).json({ success: false, message: 'Failed to delete vacancy' });
    }
});

// Match vacancy with CVs using AI (premium only)
app.get('/api/employer/vacancies/:id/matches', requireEmployer, async (req, res) => {
    try {
        const plan = req.employer.plan || 'basic';
        if (plan !== 'premium') {
            return res.status(403).json({
                success: false,
                message: 'Upgrade naar Premium voor vacature matching'
            });
        }

        await connectDB();
        const vacancy = await Vacancy.findOne({
            _id: req.params.id,
            employerId: req.employer.employerId
        });

        if (!vacancy) {
            return res.status(404).json({ success: false, message: 'Vacature niet gevonden' });
        }

        const vacancyText = vacancy.fullText || `${vacancy.title} ${vacancy.description || ''} ${vacancy.requirements || ''}`;
        const cvs = await CV.find().select('-fileData');

        let matchedCVs = [];

        // Use AI matching if Gemini is configured
        if (gemini) {
            try {
                const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

                // Prepare CV summaries for AI (limit text length to save tokens)
                const cvSummaries = cvs.map((cv, index) => {
                    const summary = `[CV ${index}] ${cv.fullName} | ${cv.jobTitle || 'Geen functie'} | Skills: ${cv.skills || 'N/A'} | Ervaring: ${(cv.experience || '').substring(0, 500)}`;
                    return { index, cv, summary };
                });

                const prompt = `Je bent een STRENGE recruitment AI. Match ALLEEN kandidaten die ECHT geschikt zijn voor deze vacature.

VACATURE:
${vacancyText.substring(0, 1500)}

KANDIDATEN:
${cvSummaries.map(s => s.summary).join('\n\n')}

STRIKTE REGELS:
- Score 80-100: Functietitel EN ervaring matchen direct met de vacature
- Score 60-79: Zeer relevante ervaring, vergelijkbare functie
- Score 0-59: NIET TONEN - onvoldoende match
- Een "Senior Software Developer" vacature matcht ALLEEN met developers/programmeurs
- Iemand in Insurance/Finance/Sales is GEEN match voor een IT development rol
- Kijk naar de PRIMAIRE functie, niet naar bijzaken

Geef ALLEEN kandidaten met score >= 60:
[{"index": 0, "score": 85, "reason": "Korte reden"}]

Geen matches? Antwoord: []
Antwoord ALLEEN met JSON array.`;

                const result = await model.generateContent(prompt);
                const aiResponse = result.response.text().trim();

                // Parse JSON from response
                const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const aiMatches = JSON.parse(jsonMatch[0]);
                    matchedCVs = aiMatches
                        .filter(m => m.score >= 60)
                        .map(m => ({
                            ...cvSummaries[m.index].cv.toObject(),
                            matchScore: m.score,
                            matchReason: m.reason
                        }))
                        .sort((a, b) => b.matchScore - a.matchScore)
                        .slice(0, 15);
                }
            } catch (aiError) {
                console.error('AI matching error:', aiError);
                // Fall back to keyword matching
            }
        }

        // Fallback: simple keyword matching if AI fails or not configured
        if (matchedCVs.length === 0) {
            const keywords = vacancyText
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 4)
                .filter((word, index, self) => self.indexOf(word) === index);

            matchedCVs = cvs.map(cv => {
                const cvText = (cv.fullText || `${cv.fullName} ${cv.jobTitle || ''} ${cv.skills || ''}`).toLowerCase();
                let matchCount = 0;
                const matchedKeywords = [];
                keywords.forEach(keyword => {
                    if (cvText.includes(keyword)) {
                        matchCount++;
                        matchedKeywords.push(keyword);
                    }
                });
                const matchScore = keywords.length > 0 ? Math.round((matchCount / keywords.length) * 100) : 0;
                return {
                    ...cv.toObject(),
                    matchScore,
                    matchReason: matchedKeywords.length > 0 ? `Matcht op: ${matchedKeywords.slice(0, 5).join(', ')}` : ''
                };
            })
            .filter(cv => cv.matchScore >= 25)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 15);
        }

        res.json({
            success: true,
            vacancy: { _id: vacancy._id, title: vacancy.title },
            matches: matchedCVs
        });

    } catch (error) {
        console.error('Error matching CVs:', error);
        res.status(500).json({ success: false, message: 'Failed to match CVs' });
    }
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// LinkedIn PDF Parser
async function parseLinkedInPDF(base64Data) {
    if (!pdfParse) {
        console.log('PDF parsing not available');
        return null;
    }

    try {
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        const data = await pdfParse(buffer, { max: 0 }); // max: 0 to prevent test file loading
        const text = data.text;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        const result = {
            fullName: '',
            jobTitle: '',
            location: '',
            email: '',
            phone: '',
            summary: '',
            experience: '',
            education: '',
            skills: '',
            languages: ''
        };

        // LinkedIn PDFs typically start with the name at the very top
        // Format: Name, then headline/title, then location
        let currentSection = '';
        let experienceLines = [];
        let educationLines = [];
        let skillsLines = [];
        let summaryLines = [];
        let languageLines = [];

        // Find name - usually first non-empty line that's not "LinkedIn" or similar
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i];
            if (line &&
                !line.toLowerCase().includes('linkedin') &&
                !line.toLowerCase().includes('page') &&
                !line.includes('@') &&
                line.length > 2 &&
                line.length < 60 &&
                !line.match(/^\d/)) {
                result.fullName = line;
                break;
            }
        }

        // Parse through all lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLower = line.toLowerCase();

            // Detect section headers
            if (lineLower === 'experience' || lineLower === 'werkervaring' || lineLower === 'ervaring') {
                currentSection = 'experience';
                continue;
            } else if (lineLower === 'education' || lineLower === 'opleiding' || lineLower === 'opleidingen') {
                currentSection = 'education';
                continue;
            } else if (lineLower === 'skills' || lineLower === 'vaardigheden' || lineLower.includes('top skills')) {
                currentSection = 'skills';
                continue;
            } else if (lineLower === 'summary' || lineLower === 'samenvatting' || lineLower === 'about' || lineLower === 'over') {
                currentSection = 'summary';
                continue;
            } else if (lineLower === 'languages' || lineLower === 'talen') {
                currentSection = 'languages';
                continue;
            } else if (lineLower === 'contact' || lineLower === 'contactgegevens') {
                currentSection = 'contact';
                continue;
            } else if (lineLower === 'certifications' || lineLower === 'certificaten' ||
                       lineLower === 'honors' || lineLower === 'awards' ||
                       lineLower === 'publications' || lineLower === 'projects') {
                currentSection = 'other';
                continue;
            }

            // Extract email
            const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch && !result.email) {
                result.email = emailMatch[0];
            }

            // Extract phone (various formats)
            const phoneMatch = line.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
            if (phoneMatch && !result.phone && line.length < 30) {
                result.phone = phoneMatch[0].trim();
            }

            // Job title is usually right after the name (within first 10 lines, before Experience)
            if (!result.jobTitle && i < 10 && i > 0 && currentSection === '') {
                if (line !== result.fullName &&
                    !line.includes('@') &&
                    !line.match(/^\+?\d/) &&
                    line.length > 3 &&
                    line.length < 100 &&
                    !lineLower.includes('linkedin') &&
                    !lineLower.includes('contact')) {
                    // Check if it looks like a job title
                    if (!result.jobTitle) {
                        result.jobTitle = line;
                    } else if (!result.location &&
                               (line.includes(',') ||
                                lineLower.includes('netherlands') ||
                                lineLower.includes('nederland') ||
                                lineLower.includes('amsterdam') ||
                                lineLower.includes('rotterdam') ||
                                lineLower.includes('suriname') ||
                                lineLower.includes('paramaribo'))) {
                        result.location = line;
                    }
                }
            }

            // Location detection (usually contains city, country)
            if (!result.location && i < 15) {
                if ((line.includes(',') && line.length < 50) ||
                    lineLower.includes('netherlands') ||
                    lineLower.includes('nederland') ||
                    lineLower.includes('suriname') ||
                    lineLower.includes('belgium') ||
                    lineLower.includes('belgië')) {
                    if (line !== result.fullName && line !== result.jobTitle) {
                        result.location = line;
                    }
                }
            }

            // Collect section content
            if (currentSection === 'experience' && line.length > 0) {
                experienceLines.push(line);
            } else if (currentSection === 'education' && line.length > 0) {
                educationLines.push(line);
            } else if (currentSection === 'skills' && line.length > 0) {
                skillsLines.push(line);
            } else if (currentSection === 'summary' && line.length > 0) {
                summaryLines.push(line);
            } else if (currentSection === 'languages' && line.length > 0) {
                languageLines.push(line);
            }
        }

        // Format collected data
        if (experienceLines.length > 0) {
            result.experience = experienceLines.slice(0, 30).join('\n');
        }
        if (educationLines.length > 0) {
            result.education = educationLines.slice(0, 15).join('\n');
        }
        if (skillsLines.length > 0) {
            result.skills = skillsLines.slice(0, 20).join(', ');
        }
        if (summaryLines.length > 0) {
            result.summary = summaryLines.slice(0, 10).join(' ');
        }
        if (languageLines.length > 0) {
            result.languages = languageLines.slice(0, 10).join(', ');
        }

        return result;
    } catch (error) {
        console.error('PDF parsing error:', error);
        return null;
    }
}

// Generate CV HTML for email
function generateCVHTML(formData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .cv-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
            }
            .cv-name {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #2d3748;
            }
            .cv-title {
                font-size: 18px;
                color: #667eea;
                margin-bottom: 15px;
                font-style: italic;
            }
            .cv-contact {
                font-size: 14px;
                color: #4a5568;
            }
            .cv-section {
                margin-bottom: 25px;
            }
            .cv-section-title {
                font-size: 18px;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e2e8f0;
            }
            .cv-content {
                font-size: 14px;
                white-space: pre-line;
            }
        </style>
    </head>
    <body>
        <div class="cv-header">
            <div class="cv-name">${formData.fullName || 'Applicant Name'}</div>
            <div class="cv-title">${formData.jobTitle || 'Professional Title'}</div>
            <div class="cv-contact">
                ${formData.email || 'No email provided'} • 
                ${formData.phone || 'No phone provided'} • 
                ${formData.location || 'No location provided'}
            </div>
        </div>
        
        ${formData.summary ? `
            <div class="cv-section">
                <div class="cv-section-title">Professional Summary</div>
                <div class="cv-content">${formData.summary}</div>
            </div>
        ` : ''}
        
        ${formData.experience ? `
            <div class="cv-section">
                <div class="cv-section-title">Work Experience</div>
                <div class="cv-content">${formData.experience}</div>
            </div>
        ` : ''}
        
        ${formData.education ? `
            <div class="cv-section">
                <div class="cv-section-title">Education</div>
                <div class="cv-content">${formData.education}</div>
            </div>
        ` : ''}
        
        ${formData.skills ? `
            <div class="cv-section">
                <div class="cv-section-title">Skills</div>
                <div class="cv-content">${formData.skills}</div>
            </div>
        ` : ''}
        
        ${formData.achievements ? `
            <div class="cv-section">
                <div class="cv-section-title">Achievements & Projects</div>
                <div class="cv-content">${formData.achievements}</div>
            </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666;">
            <p>CV submitted on: ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;
}

// Generate Word document
function generateWordCV(formData) {
    const sections = [];

    // Header with personal info
    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: formData.fullName || 'Applicant Name',
                    bold: true,
                    size: 32,
                    color: "2d3748"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: formData.jobTitle || 'Professional Title',
                    italics: true,
                    size: 24,
                    color: "667eea"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    // Contact information
    const contactInfo = [];
    if (formData.email) contactInfo.push(formData.email);
    if (formData.phone) contactInfo.push(formData.phone);
    if (formData.location) contactInfo.push(formData.location);
    if (formData.birthDate) contactInfo.push(`Born: ${formData.birthDate.replace(/\//g, '-')}`);

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: contactInfo.join(' • '),
                    size: 20,
                    color: "4a5568"
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // Add sections for each CV field
    const cvSections = [
        { field: 'summary', title: 'Professional Summary' },
        { field: 'languages', title: 'Languages' },
        { field: 'experience', title: 'Work Experience' },
        { field: 'education', title: 'Education' },
        { field: 'skills', title: 'Skills' },
        { field: 'achievements', title: 'Achievements & Projects' }
    ];

    cvSections.forEach(section => {
        if (formData[section.field] && formData[section.field].trim()) {
            // Section title
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: section.title.toUpperCase(),
                            bold: true,
                            size: 24,
                            color: "1a202c"
                        })
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 }
                })
            );

            // Section content
            const contentLines = formData[section.field].split('\n');
            contentLines.forEach(line => {
                if (line.trim()) {
                    sections.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line,
                                    size: 20,
                                    color: "4a5568"
                                })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                }
            });
        }
    });

    // Footer
    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `CV submitted on: ${new Date().toLocaleDateString()}`,
                    size: 18,
                    color: "666666",
                    italics: true
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 }
        })
    );

    const doc = new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });

    return doc;
}

// Submit CV endpoint
app.post('/submit-cv', async (req, res) => {
    try {
        const formData = req.body;

        // Validate required fields
        if (!formData.fullName || !formData.email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        // Connect to database (for serverless)
        await connectDB();

        // Save CV to database
        let savedCV = null;
        if (mongoose.connection.readyState === 1) {
            const cv = new CV({
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                location: formData.location,
                birthDate: formData.birthDate,
                jobTitle: formData.jobTitle,
                summary: formData.summary,
                languages: formData.languages,
                experience: formData.experience,
                education: formData.education,
                skills: formData.skills,
                achievements: formData.achievements,
                emailSent: false
            });
            savedCV = await cv.save();
            console.log(`CV saved to database with ID: ${savedCV._id}`);
        }

        // Generate CV HTML
        const cvHTML = generateCVHTML(formData);

        // Generate Word document
        const wordDoc = generateWordCV(formData);
        const wordBuffer = await Packer.toBuffer(wordDoc);

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECIPIENT_EMAIL,
            subject: `New CV Submission: ${formData.fullName}`,
            html: cvHTML,
            replyTo: formData.email,
            attachments: [
                {
                    filename: `CV_${formData.fullName?.replace(/\s+/g, '_') || 'Applicant'}.docx`,
                    content: wordBuffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
            ]
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Update emailSent status in database
        if (savedCV) {
            await CV.findByIdAndUpdate(savedCV._id, { emailSent: true });
        }

        console.log(`CV received from ${formData.fullName} (${formData.email})`);

        res.json({
            success: true,
            message: 'CV submitted successfully!'
        });

    } catch (error) {
        console.error('Error submitting CV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit CV. Please try again.'
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Submit feedback endpoint
app.post('/submit-feedback', async (req, res) => {
    try {
        const feedbackData = req.body;

        // Validate required fields
        if (!feedbackData.feedbackMessage) {
            return res.status(400).json({
                success: false,
                message: 'Feedback message is required'
            });
        }

        // Generate feedback email HTML
        const feedbackHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .feedback-header {
                    background: linear-gradient(135deg, #2ec4b6, #26a69a);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .feedback-content {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .feedback-field {
                    margin-bottom: 15px;
                }
                .feedback-label {
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 5px;
                }
                .feedback-value {
                    color: #4a5568;
                    background: white;
                    padding: 10px;
                    border-radius: 4px;
                    border-left: 4px solid #2ec4b6;
                }
                .rating-stars {
                    font-size: 18px;
                    color: #ffd700;
                }
            </style>
        </head>
        <body>
            <div class="feedback-header">
                <h2>💬 New Feedback Received</h2>
                <p>CV Questionnaire User Feedback</p>
            </div>

            <div class="feedback-content">
                ${feedbackData.feedbackName ? `
                    <div class="feedback-field">
                        <div class="feedback-label">Name:</div>
                        <div class="feedback-value">${feedbackData.feedbackName}</div>
                    </div>
                ` : ''}

                ${feedbackData.feedbackEmail ? `
                    <div class="feedback-field">
                        <div class="feedback-label">Email:</div>
                        <div class="feedback-value">${feedbackData.feedbackEmail}</div>
                    </div>
                ` : ''}

                ${feedbackData.feedbackRating ? `
                    <div class="feedback-field">
                        <div class="feedback-label">Rating:</div>
                        <div class="feedback-value">
                            <span class="rating-stars">${'★'.repeat(parseInt(feedbackData.feedbackRating))}${'☆'.repeat(5 - parseInt(feedbackData.feedbackRating))}</span>
                            (${feedbackData.feedbackRating}/5 stars)
                        </div>
                    </div>
                ` : ''}

                <div class="feedback-field">
                    <div class="feedback-label">Feedback Message:</div>
                    <div class="feedback-value">${feedbackData.feedbackMessage.replace(/\n/g, '<br>')}</div>
                </div>
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666; text-align: center;">
                <p>Feedback submitted on: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
        `;

        // Email options for feedback
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECIPIENT_EMAIL,
            subject: `CV Questionnaire Feedback ${feedbackData.feedbackRating ? `(${feedbackData.feedbackRating}★)` : ''}`,
            html: feedbackHTML,
            replyTo: feedbackData.feedbackEmail || process.env.EMAIL_USER
        };

        // Send feedback email
        await transporter.sendMail(mailOptions);

        console.log(`Feedback received ${feedbackData.feedbackName ? `from ${feedbackData.feedbackName}` : 'anonymously'}`);

        res.json({
            success: true,
            message: 'Feedback submitted successfully!'
        });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback. Please try again.'
        });
    }
});

// Create CV manually (protected - admin only)
app.post('/api/cvs', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const formData = req.body;

        // Validate required fields
        if (!formData.fullName || !formData.email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        const cv = new CV({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            birthDate: formData.birthDate,
            jobTitle: formData.jobTitle,
            summary: formData.summary,
            languages: formData.languages,
            experience: formData.experience,
            education: formData.education,
            skills: formData.skills,
            achievements: formData.achievements,
            emailSent: true // Mark as already processed since it's manual entry
        });

        const savedCV = await cv.save();
        console.log(`CV manually added: ${savedCV.fullName} (${savedCV.email})`);

        res.json({
            success: true,
            message: 'CV added successfully',
            data: savedCV
        });

    } catch (error) {
        console.error('Error creating CV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create CV'
        });
    }
});

// Get all CVs endpoint (protected)
app.get('/api/cvs', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        // Exclude fileData from list (too large), include file metadata
        const cvs = await CV.find().select('-fileData').sort({ createdAt: -1 });
        res.json({
            success: true,
            count: cvs.length,
            data: cvs
        });
    } catch (error) {
        console.error('Error fetching CVs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CVs'
        });
    }
});

// Get single CV by ID (protected)
app.get('/api/cvs/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const cv = await CV.findById(req.params.id);
        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'CV not found'
            });
        }

        res.json({
            success: true,
            data: cv
        });
    } catch (error) {
        console.error('Error fetching CV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CV'
        });
    }
});

// Delete CV by ID (protected)
app.delete('/api/cvs/:id', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const cv = await CV.findByIdAndDelete(req.params.id);
        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'CV not found'
            });
        }

        res.json({
            success: true,
            message: 'CV deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting CV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete CV'
        });
    }
});

// Upload CV file endpoint (protected)
app.post('/api/cvs/upload', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const { fullName, email, phone, jobTitle, location, summary, experience, education, skills, fullText, fileName, fileData, fileType, fileSize } = req.body;

        // Validate required fields
        if (!fileData) {
            return res.status(400).json({
                success: false,
                message: 'File is required'
            });
        }

        // Check file size (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: 'File size must be less than 10MB'
            });
        }

        // Data comes from client-side parsing now
        const cvData = {
            fullName: fullName || fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
            email: email || '', // Geen nep-email meer genereren
            phone: phone || '',
            jobTitle: jobTitle || '',
            location: location || '',
            summary: summary || '',
            experience: experience || '',
            education: education || '',
            skills: skills || '',
            fullText: fullText || '', // All PDF text for searching
            fileName,
            fileData,
            fileType,
            fileSize,
            emailSent: true // Manual upload, no email needed
        };

        const cv = new CV(cvData);
        const savedCV = await cv.save();
        console.log(`CV file uploaded: ${savedCV.fullName} - ${fileName}`);

        res.json({
            success: true,
            message: 'CV uploaded successfully',
            data: {
                _id: savedCV._id,
                fullName: savedCV.fullName,
                email: savedCV.email,
                jobTitle: savedCV.jobTitle,
                location: savedCV.location,
                fileName: savedCV.fileName,
                fileSize: savedCV.fileSize
            }
        });

    } catch (error) {
        console.error('Error uploading CV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload CV'
        });
    }
});

// Download CV file endpoint (protected)
app.get('/api/cvs/:id/download', requireAdmin, async (req, res) => {
    try {
        await connectDB();

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const cv = await CV.findById(req.params.id);
        if (!cv) {
            return res.status(404).json({
                success: false,
                message: 'CV not found'
            });
        }

        if (!cv.fileData) {
            return res.status(404).json({
                success: false,
                message: 'No file attached to this CV'
            });
        }

        // Return file data for download
        res.json({
            success: true,
            data: {
                fileName: cv.fileName,
                fileType: cv.fileType,
                fileData: cv.fileData
            }
        });

    } catch (error) {
        console.error('Error downloading CV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download CV'
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    await connectDB();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Export for Vercel serverless
module.exports = app;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit: http://localhost:${PORT}`);
    });
}