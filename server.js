const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});