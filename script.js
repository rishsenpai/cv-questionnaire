document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('questionnaire');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const progress = document.getElementById('progress');
    const generateBtn = document.getElementById('generateCV');
    const modal = document.getElementById('cvModal');
    const closeModal = document.querySelector('.close');
    const downloadBtn = document.getElementById('downloadCV');
    const langToggle = document.getElementById('langToggle');
    const demoBtn = document.getElementById('demoBtn');
    
    let currentQuestion = 0;
    const totalQuestions = 11; // 0-10
    const formData = {};
    let currentLanguage = 'en';
    
    const questions = document.querySelectorAll('.question-container');
    
    // Language translations
    const translations = {
        en: {
            'start-title': "Let's start with your personal information",
            'fullname-label': "What's your full name?",
            'fullname-placeholder': "Enter your full name",
            'email-label': "What's your email address?",
            'email-placeholder': "your.email@example.com",
            'phone-label': "What's your phone number?",
            'phone-placeholder': "+1 (555) 123-4567",
            'location-label': "Where are you located?",
            'location-placeholder': "City, Country",
            'jobtitle-label': "What's your current job title or desired position?",
            'jobtitle-placeholder': "Software Developer, Marketing Manager, etc.",
            'summary-label': "Tell us about yourself in a few sentences",
            'summary-placeholder': "A brief professional summary highlighting your key strengths and experience...",
            'experience-label': "Describe your work experience",
            'experience-placeholder': "List your previous jobs, responsibilities, and achievements. Use bullet points if you like...",
            'education-label': "What's your educational background?",
            'education-placeholder': "Degree, Institution, Year of graduation, relevant coursework...",
            'skills-label': "What are your key skills?",
            'skills-placeholder': "List your technical skills, soft skills, languages, certifications...",
            'achievements-label': "Any notable achievements or projects?",
            'achievements-placeholder': "Awards, successful projects, publications, volunteer work...",
            'complete-title': "Perfect! Your CV is ready",
            'complete-description': "We've gathered all the information needed to create your professional CV.",
            'submit-btn': "Submit CV",
            'prev-btn': "← Previous",
            'next-btn': "Continue →",
            'download-btn': "Download PDF",
            'lang-toggle': "🇳🇱 Nederlands",
            'cv-section-summary': "Professional Summary",
            'cv-section-experience': "Work Experience", 
            'cv-section-education': "Education",
            'cv-section-skills': "Skills",
            'cv-section-achievements': "Achievements & Projects",
            'success-title': "✅ CV Submitted Successfully!",
            'success-message': "Thank you for submitting your CV. It has been sent and you'll hear back soon.",
            'success-button': "Submit Another CV",
            'error-title': "❌ Submission Failed",
            'error-button': "Try Again",
            'submitting': "Submitting...",
            'demo-btn': "🎯 Demo"
        },
        nl: {
            'start-title': "Laten we beginnen met je persoonlijke gegevens",
            'fullname-label': "Wat is je volledige naam?",
            'fullname-placeholder': "Voer je volledige naam in",
            'email-label': "Wat is je e-mailadres?",
            'email-placeholder': "jouw.email@voorbeeld.nl",
            'phone-label': "Wat is je telefoonnummer?",
            'phone-placeholder': "+31 6 12345678",
            'location-label': "Waar woon je?",
            'location-placeholder': "Stad, Land",
            'jobtitle-label': "Wat is je huidige functietitel of gewenste positie?",
            'jobtitle-placeholder': "Software Ontwikkelaar, Marketing Manager, etc.",
            'summary-label': "Vertel ons over jezelf in een paar zinnen",
            'summary-placeholder': "Een korte professionele samenvatting waarin je belangrijkste kwaliteiten en ervaring worden benadrukt...",
            'experience-label': "Beschrijf je werkervaring",
            'experience-placeholder': "Vermeld je eerdere banen, verantwoordelijkheden en prestaties. Gebruik puntjes als je wilt...",
            'education-label': "Wat is je onderwijsachtergrond?",
            'education-placeholder': "Diploma, Instelling, Jaar van afstuderen, relevante vakken...",
            'skills-label': "Wat zijn je belangrijkste vaardigheden?",
            'skills-placeholder': "Vermeld je technische vaardigheden, sociale vaardigheden, talen, certificeringen...",
            'achievements-label': "Heb je opmerkelijke prestaties of projecten?",
            'achievements-placeholder': "Prijzen, succesvolle projecten, publicaties, vrijwilligerswerk...",
            'complete-title': "Perfect! Je CV is klaar",
            'complete-description': "We hebben alle informatie verzameld die nodig is om je professionele CV te maken.",
            'submit-btn': "CV Versturen",
            'prev-btn': "← Vorige",
            'next-btn': "Doorgaan →",
            'download-btn': "PDF Downloaden",
            'lang-toggle': "🇬🇧 English",
            'cv-section-summary': "Professionele Samenvatting",
            'cv-section-experience': "Werkervaring", 
            'cv-section-education': "Onderwijs",
            'cv-section-skills': "Vaardigheden",
            'cv-section-achievements': "Prestaties & Projecten",
            'success-title': "✅ CV Succesvol Verzonden!",
            'success-message': "Bedankt voor het versturen van je CV. Het is verzonden en je hoort snel iets terug.",
            'success-button': "Nog een CV Versturen",
            'error-title': "❌ Versturen Mislukt",
            'error-button': "Opnieuw Proberen",
            'submitting': "Versturen...",
            'demo-btn': "🎯 Demo"
        }
    };
    
    // Demo data
    const demoData = {
        en: {
            fullName: "Sarah Johnson",
            email: "sarah.johnson@email.com", 
            phone: "+1 (555) 123-4567",
            location: "San Francisco, CA",
            jobTitle: "Senior Software Engineer",
            summary: "Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud architecture. Passionate about creating scalable solutions and mentoring junior developers.",
            experience: "• Senior Software Engineer at TechCorp (2020-Present)\n  - Led development of microservices architecture serving 1M+ users\n  - Improved application performance by 40% through optimization\n  - Mentored team of 5 junior developers\n\n• Software Engineer at StartupXYZ (2018-2020)\n  - Built responsive web applications using React and Redux\n  - Collaborated with cross-functional teams in Agile environment\n  - Implemented CI/CD pipelines reducing deployment time by 60%",
            education: "• Master of Science in Computer Science\n  Stanford University, 2018\n  GPA: 3.8/4.0\n\n• Bachelor of Science in Software Engineering\n  UC Berkeley, 2016\n  Summa Cum Laude, Dean's List",
            skills: "Technical Skills:\n• Frontend: React, Vue.js, TypeScript, HTML/CSS, Tailwind\n• Backend: Node.js, Python, Java, PostgreSQL, MongoDB\n• Cloud: AWS, Docker, Kubernetes, Terraform\n• Tools: Git, Jenkins, Jira, Figma\n\nSoft Skills:\n• Team Leadership & Mentoring\n• Agile/Scrum Methodologies\n• Problem Solving & Critical Thinking\n• Technical Communication",
            achievements: "• Led migration of legacy monolith to microservices, reducing system downtime by 75%\n• Open source contributor to popular React library with 10k+ GitHub stars\n• Speaker at TechConf 2023: 'Building Scalable React Applications'\n• Recipient of 'Innovation Award' at TechCorp for implementing ML-based recommendation system\n• Volunteer coding instructor at local community center"
        },
        nl: {
            fullName: "Anna de Vries",
            email: "anna.devries@email.nl",
            phone: "+31 6 12345678", 
            location: "Amsterdam, Nederland",
            jobTitle: "Senior Software Ontwikkelaar",
            summary: "Ervaren software ontwikkelaar met 8+ jaar ervaring in full-stack development, gespecialiseerd in React, Node.js en cloud architectuur. Gepassioneerd over het creëren van schaalbare oplossingen en het begeleiden van junior ontwikkelaars.",
            experience: "• Senior Software Ontwikkelaar bij TechBedrijf (2020-Heden)\n  - Leidde ontwikkeling van microservices architectuur voor 1M+ gebruikers\n  - Verbeterde applicatie prestaties met 40% door optimalisatie\n  - Begeleidde team van 5 junior ontwikkelaars\n\n• Software Ontwikkelaar bij StartupXYZ (2018-2020)\n  - Bouwde responsieve webapplicaties met React en Redux\n  - Werkte samen met multidisciplinaire teams in Agile omgeving\n  - Implementeerde CI/CD pipelines met 60% snellere deployments",
            education: "• Master of Science in Informatica\n  Universiteit van Amsterdam, 2018\n  Gemiddeld: 8.5/10\n\n• Bachelor of Science in Software Engineering\n  TU Delft, 2016\n  Cum Laude, Dean's List",
            skills: "Technische Vaardigheden:\n• Frontend: React, Vue.js, TypeScript, HTML/CSS, Tailwind\n• Backend: Node.js, Python, Java, PostgreSQL, MongoDB\n• Cloud: AWS, Docker, Kubernetes, Terraform\n• Tools: Git, Jenkins, Jira, Figma\n\nSociale Vaardigheden:\n• Teamleiderschap & Mentoring\n• Agile/Scrum Methodologieën\n• Probleemoplossing & Kritisch Denken\n• Technische Communicatie",
            achievements: "• Leidde migratie van legacy monoliet naar microservices, 75% minder downtime\n• Open source contributor aan populaire React library met 10k+ GitHub stars\n• Spreker op TechConf 2023: 'Schaalbare React Applicaties Bouwen'\n• Ontvanger van 'Innovatie Award' bij TechBedrijf voor ML-based aanbevelingssysteem\n• Vrijwillige programmeer instructeur bij lokaal buurthuis"
        }
    };

    // Language toggle functionality
    langToggle.addEventListener('click', function() {
        currentLanguage = currentLanguage === 'en' ? 'nl' : 'en';
        updateLanguage();
        localStorage.setItem('preferredLanguage', currentLanguage);
    });
    
    // Demo functionality
    demoBtn.addEventListener('click', function() {
        const demo = demoData[currentLanguage];
        
        // Fill form data
        Object.keys(demo).forEach(key => {
            formData[key] = demo[key];
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = demo[key];
            }
        });
        
        // Jump to final screen
        currentQuestion = totalQuestions - 1;
        showQuestion(currentQuestion);
        updateProgress();
        updateNavigation();
        
        // Generate and show CV
        generateCV();
        modal.style.display = 'block';
    });
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    
    // Initialize language
    updateLanguage();
    
    // Show first question
    showQuestion(0);
    
    // Navigation event listeners
    nextBtn.addEventListener('click', function() {
        if (validateCurrentQuestion()) {
            saveCurrentAnswer();
            if (currentQuestion < totalQuestions - 1) {
                currentQuestion++;
                showQuestion(currentQuestion);
                updateProgress();
                updateNavigation();
            }
        }
    });
    
    prevBtn.addEventListener('click', function() {
        if (currentQuestion > 0) {
            saveCurrentAnswer();
            currentQuestion--;
            showQuestion(currentQuestion);
            updateProgress();
            updateNavigation();
        }
    });
    
    // Enter key navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (nextBtn.style.display !== 'none') {
                nextBtn.click();
            }
        }
    });
    
    // Real-time validation
    form.addEventListener('input', function(e) {
        updateNextButton();
    });
    
    // Generate CV button
    generateBtn.addEventListener('click', function() {
        saveCurrentAnswer();
        submitCV();
    });
    
    // Modal close
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Download functionality
    downloadBtn.addEventListener('click', function() {
        downloadPDF();
    });
    
    function showQuestion(questionIndex) {
        questions.forEach((q, index) => {
            if (index === questionIndex) {
                q.style.display = 'block';
                q.classList.add('active');
                // Focus on the input/textarea
                const input = q.querySelector('input, textarea');
                if (input && questionIndex < totalQuestions - 1) {
                    setTimeout(() => input.focus(), 100);
                }
            } else {
                q.style.display = 'none';
                q.classList.remove('active');
            }
        });
    }
    
    function validateCurrentQuestion() {
        const currentQuestionElement = questions[currentQuestion];
        const input = currentQuestionElement.querySelector('input, textarea');
        
        if (!input) return true; // No input to validate (final screen)
        
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('error');
            input.focus();
            return false;
        }
        
        if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                input.classList.add('error');
                input.focus();
                return false;
            }
        }
        
        input.classList.remove('error');
        return true;
    }
    
    function saveCurrentAnswer() {
        const currentQuestionElement = questions[currentQuestion];
        const input = currentQuestionElement.querySelector('input, textarea');
        
        if (input && input.name) {
            formData[input.name] = input.value.trim();
        }
    }
    
    function updateProgress() {
        const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;
        progress.style.width = progressPercentage + '%';
    }
    
    function updateNavigation() {
        // Show/hide previous button
        if (currentQuestion === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
        }
        
        // Show/hide next button (hide on final screen)
        if (currentQuestion === totalQuestions - 1) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-block';
            updateNextButton();
        }
    }
    
    function updateNextButton() {
        const currentQuestionElement = questions[currentQuestion];
        const input = currentQuestionElement.querySelector('input, textarea');
        
        if (input && input.hasAttribute('required')) {
            if (input.value.trim()) {
                nextBtn.disabled = false;
            } else {
                nextBtn.disabled = true;
            }
        } else {
            nextBtn.disabled = false;
        }
    }
    
    function generateCV() {
        const cvPreview = document.getElementById('cvPreview');
        const t = translations[currentLanguage];
        
        const cvHTML = `
            <div class="cv-header">
                <div class="cv-name">${formData.fullName || 'Your Name'}</div>
                <div class="cv-title">${formData.jobTitle || 'Professional Title'}</div>
                <div class="cv-contact">
                    <span>${formData.email || 'email@example.com'}</span>
                    <span>${formData.phone || 'Phone Number'}</span>
                    <span>${formData.location || 'Location'}</span>
                </div>
            </div>
            
            ${formData.summary ? `
                <div class="cv-section">
                    <div class="cv-section-title">${t['cv-section-summary']}</div>
                    <div class="cv-content">${formData.summary}</div>
                </div>
            ` : ''}
            
            ${formData.experience ? `
                <div class="cv-section">
                    <div class="cv-section-title">${t['cv-section-experience']}</div>
                    <div class="cv-content">${formData.experience}</div>
                </div>
            ` : ''}
            
            ${formData.education ? `
                <div class="cv-section">
                    <div class="cv-section-title">${t['cv-section-education']}</div>
                    <div class="cv-content">${formData.education}</div>
                </div>
            ` : ''}
            
            ${formData.skills ? `
                <div class="cv-section">
                    <div class="cv-section-title">${t['cv-section-skills']}</div>
                    <div class="cv-content">${formData.skills}</div>
                </div>
            ` : ''}
            
            ${formData.achievements ? `
                <div class="cv-section">
                    <div class="cv-section-title">${t['cv-section-achievements']}</div>
                    <div class="cv-content">${formData.achievements}</div>
                </div>
            ` : ''}
        `;
        
        cvPreview.innerHTML = cvHTML;
    }
    
    async function submitCV() {
        try {
            // Show loading state
            const t = translations[currentLanguage];
            generateBtn.textContent = t['submitting'];
            generateBtn.disabled = true;
            
            const response = await fetch('/submit-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccessMessage();
            } else {
                showErrorMessage(result.message);
            }
            
        } catch (error) {
            console.error('Submission error:', error);
            showErrorMessage('Failed to submit CV. Please check your connection and try again.');
        } finally {
            const t = translations[currentLanguage];
            generateBtn.textContent = t['submit-btn'];
            generateBtn.disabled = false;
        }
    }
    
    function showSuccessMessage() {
        const currentQuestionElement = questions[currentQuestion];
        const t = translations[currentLanguage];
        currentQuestionElement.innerHTML = `
            <div class="question completed">
                <h2>${t['success-title']}</h2>
                <p>${t['success-message']}</p>
                <button type="button" onclick="window.location.reload()" class="generate-btn">${t['success-button']}</button>
            </div>
        `;
    }
    
    function showErrorMessage(message) {
        const currentQuestionElement = questions[currentQuestion];
        const t = translations[currentLanguage];
        currentQuestionElement.innerHTML = `
            <div class="question">
                <h2>${t['error-title']}</h2>
                <p style="color: #e53e3e; margin-bottom: 20px;">${message}</p>
                <button type="button" onclick="generateBtn.click()" class="generate-btn">${t['error-button']}</button>
            </div>
        `;
    }
    
    function downloadPDF() {
        // Simple HTML to PDF conversion using print
        const printContent = document.getElementById('cvPreview').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>CV - ${formData.fullName || 'Professional CV'}</title>
                <style>
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #2d3748;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 30px;
                        background: white;
                    }
                    .cv-header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 25px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 8px;
                    }
                    .cv-name {
                        font-size: 32px;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: white;
                    }
                    .cv-title {
                        font-size: 18px;
                        color: rgba(255, 255, 255, 0.95);
                        margin-bottom: 15px;
                        font-weight: 500;
                    }
                    .cv-contact {
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.9);
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        flex-wrap: wrap;
                    }
                    .cv-contact span {
                        background: rgba(255, 255, 255, 0.2);
                        padding: 4px 8px;
                        border-radius: 12px;
                    }
                    .cv-section {
                        margin-bottom: 30px;
                        padding: 20px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                        page-break-inside: avoid;
                    }
                    .cv-section-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #1a202c;
                        margin-bottom: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        position: relative;
                        padding-left: 15px;
                    }
                    .cv-section-title::before {
                        content: '•';
                        color: #667eea;
                        font-size: 20px;
                        position: absolute;
                        left: 0;
                        top: -2px;
                    }
                    .cv-content {
                        font-size: 14px;
                        white-space: pre-line;
                        color: #4a5568;
                        line-height: 1.7;
                        padding-left: 15px;
                    }
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            font-size: 12px;
                        }
                        .cv-header { 
                            margin-bottom: 25px; 
                            padding: 20px;
                            background: #667eea !important;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        .cv-section { 
                            margin-bottom: 20px; 
                            padding: 15px;
                            background: #f8fafc !important;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        .cv-section-title {
                            font-size: 16px;
                        }
                        .cv-content {
                            font-size: 12px;
                        }
                        .cv-contact {
                            flex-direction: row;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
    
    // Language update function
    function updateLanguage() {
        const currentTranslations = translations[currentLanguage];
        
        // Update all elements with data-text attributes
        document.querySelectorAll('[data-text]').forEach(element => {
            const key = element.getAttribute('data-text');
            if (currentTranslations[key]) {
                element.textContent = currentTranslations[key];
            }
        });
        
        // Update all elements with data-placeholder attributes
        document.querySelectorAll('[data-placeholder]').forEach(element => {
            const key = element.getAttribute('data-placeholder');
            if (currentTranslations[key]) {
                element.placeholder = currentTranslations[key];
            }
        });
        
        // Update language toggle button
        langToggle.textContent = currentTranslations['lang-toggle'];
        
        // Update document language attribute
        document.documentElement.lang = currentLanguage;
    }
    
    // Initialize
    updateNavigation();
    updateProgress();
    
    // Add error styling for validation
    const style = document.createElement('style');
    style.textContent = `
        .error {
            border-color: #e53e3e !important;
            box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
});