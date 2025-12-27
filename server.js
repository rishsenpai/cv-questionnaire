const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
require('dotenv').config();

const CV = require('./models/CV');

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
app.use(express.json());
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

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

        const cvs = await CV.find().sort({ createdAt: -1 });
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