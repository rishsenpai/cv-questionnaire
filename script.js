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
    const totalQuestions = 17; // 0-16
    const formData = {};
    let currentLanguage = 'en';
    
    const questions = document.querySelectorAll('.question-container');

    // Format date to dd-mm-yyyy for CV display
    function formatDate(dateString) {
        // If in dd/mm/yyyy format, convert to dd-mm-yyyy
        if (dateString.includes('/')) {
            return dateString.replace(/\//g, '-');
        }
        // Parse YYYY-MM-DD format if coming from date input
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }

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
            'birthdate-label': "What's your date of birth?",
            'languages-label': "Which languages do you speak and how well?",
            'languages-placeholder': "For example: Dutch (native), English (fluent speaking and writing), German (basic speaking)...",
            'jobtitle-label': "What's your current job title or desired position?",
            'jobtitle-placeholder': "Software Developer, Marketing Manager, etc.",
            'summary-label': "Tell us about yourself in a few sentences",
            'summary-placeholder': "A brief professional summary highlighting your key strengths and experience...",
            'experience-label': "Describe your work experience with periods",
            'experience-placeholder': "List for each position: Job title, Company name, Period (from-to), Tasks and responsibilities. For example:\n\n• Software Developer at TechCompany\n  January 2020 - Present\n  - Developing web applications\n  - Collaborating with design team...",
            'education-label': "What's your educational background?",
            'education-placeholder': "List for each education: Education name, Institution, Period, Diploma obtained (yes/no). For example:\n\n• Bachelor Computer Science\n  University of Amsterdam\n  2016-2020\n  Diploma obtained: Yes\n\n• HBO Business Administration\n  Amsterdam University of Applied Sciences\n  2014-2016\n  Diploma obtained: No (not completed)...",
            'skills-label': "What are your key skills?",
            'skills-placeholder': "List your technical skills, soft skills, languages, certifications...",
            'achievements-label': "Any notable achievements or projects?",
            'achievements-placeholder': "Awards, successful projects, publications, volunteer work...",
            'targetjob-label': "What position are you looking for?",
            'targetjob-placeholder': "For example: Frontend Developer, Marketing Manager...",
            'availability-label': "When are you available and how many hours per week?",
            'availability-placeholder': "For example: Available immediately, 40 hours per week...",
            'salary-label': "Salary indication?",
            'salary-placeholder': "For example: €3000-4000 per month, €50,000-60,000 per year...",
            'sector-label': "In which sector do you want to work?",
            'sector-placeholder': "For example: IT, Marketing, Finance, Healthcare...",
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
            'demo-btn': "🎯 Demo",
            'feedback-btn': "💬 Feedback",
            'feedback-title': "Share Your Feedback",
            'feedback-description': "Help us improve the CV questionnaire by sharing your thoughts.",
            'feedback-name-label': "Your Name (Optional)",
            'feedback-name-placeholder': "Enter your name",
            'feedback-email-label': "Your Email (Optional)",
            'feedback-email-placeholder': "your.email@example.com",
            'feedback-rating-label': "How would you rate your experience?",
            'feedback-message-label': "Your Feedback",
            'feedback-message-placeholder': "Tell us what you think about the questionnaire, what could be improved, or what you liked...",
            'feedback-cancel': "Cancel",
            'feedback-submit': "Send Feedback",
            'tooltip-feedback-required': "Please provide your feedback message"
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
            'birthdate-label': "Wat is je geboortedatum?",
            'languages-label': "Welke talen spreek je en hoe goed?",
            'languages-placeholder': "Bijvoorbeeld: Nederlands (moedertaal), Engels (vloeiend mondeling en schriftelijk), Duits (basis mondeling)...",
            'jobtitle-label': "Wat is je huidige functietitel of gewenste positie?",
            'jobtitle-placeholder': "Software Ontwikkelaar, Marketing Manager, etc.",
            'summary-label': "Vertel ons over jezelf in een paar zinnen",
            'summary-placeholder': "Een korte professionele samenvatting waarin je belangrijkste kwaliteiten en ervaring worden benadrukt...",
            'experience-label': "Beschrijf je werkervaring met periodes",
            'experience-placeholder': "Vermeld per functie: Functietitel, Bedrijfsnaam, Periode (van-tot), Taken en verantwoordelijkheden. Bijvoorbeeld:\n\n• Software Developer bij TechBedrijf\n  Januari 2020 - Heden\n  - Ontwikkelen van webapplicaties\n  - Samenwerken met design team...",
            'education-label': "Wat is je onderwijsachtergrond?",
            'education-placeholder': "Vermeld per opleiding: Naam opleiding, Instelling, Periode, Diploma behaald (ja/nee). Bijvoorbeeld:\n\n• Bachelor Informatica\n  Universiteit van Amsterdam\n  2016-2020\n  Diploma behaald: Ja\n\n• HBO Bedrijfskunde\n  Hogeschool van Amsterdam\n  2014-2016\n  Diploma behaald: Nee (niet afgemaakt)...",
            'skills-label': "Wat zijn je belangrijkste vaardigheden?",
            'skills-placeholder': "Vermeld je technische vaardigheden, sociale vaardigheden, talen, certificeringen...",
            'achievements-label': "Heb je opmerkelijke prestaties of projecten?",
            'achievements-placeholder': "Prijzen, succesvolle projecten, publicaties, vrijwilligerswerk...",
            'targetjob-label': "Wat is de functie die je zoekt?",
            'targetjob-placeholder': "Bijvoorbeeld: Frontend Developer, Marketing Manager...",
            'availability-label': "Per wanneer ben je beschikbaar en hoeveel uur per week?",
            'availability-placeholder': "Bijvoorbeeld: Per direct beschikbaar, 40 uur per week...",
            'salary-label': "Salarisindicatie?",
            'salary-placeholder': "Bijvoorbeeld: €3000-4000 per maand, €50.000-60.000 per jaar...",
            'sector-label': "In welke sector wil je werken?",
            'sector-placeholder': "Bijvoorbeeld: IT, Marketing, Financiën, Zorg...",
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
            'demo-btn': "🎯 Demo",
            'feedback-btn': "💬 Feedback",
            'feedback-title': "Deel je Feedback",
            'feedback-description': "Help ons de CV vragenlijst te verbeteren door je mening te delen.",
            'feedback-name-label': "Je Naam (Optioneel)",
            'feedback-name-placeholder': "Voer je naam in",
            'feedback-email-label': "Je Email (Optioneel)",
            'feedback-email-placeholder': "je.email@voorbeeld.nl",
            'feedback-rating-label': "Hoe zou je je ervaring beoordelen?",
            'feedback-message-label': "Je Feedback",
            'feedback-message-placeholder': "Vertel ons wat je van de vragenlijst vindt, wat er verbeterd kan worden, of wat je leuk vond...",
            'feedback-cancel': "Annuleren",
            'feedback-submit': "Feedback Versturen",
            'tooltip-feedback-required': "Geef je feedback bericht"
        }
    };
    
    // Demo data
    const demoData = {
        en: {
            fullName: "Sarah Johnson",
            email: "sarah.johnson@email.com",
            phone: "+1 (555) 123-4567",
            location: "San Francisco, CA",
            birthDate: "15/03/1990",
            languages: "English (native)\nSpanish (fluent speaking and writing)\nFrench (conversational speaking, basic writing)",
            jobTitle: "Senior Software Engineer",
            summary: "Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud architecture. Passionate about creating scalable solutions and mentoring junior developers.",
            experience: "• Senior Software Engineer at TechCorp\n  March 2020 - Present\n  - Led development of microservices architecture serving 1M+ users\n  - Improved application performance by 40% through optimization\n  - Mentored team of 5 junior developers\n\n• Software Engineer at StartupXYZ\n  June 2018 - February 2020\n  - Built responsive web applications using React and Redux\n  - Collaborated with cross-functional teams in Agile environment\n  - Implemented CI/CD pipelines reducing deployment time by 60%",
            education: "• Master of Science in Computer Science\n  Stanford University\n  2016-2018\n  Diploma obtained: Yes\n  GPA: 3.8/4.0\n\n• Bachelor of Science in Software Engineering\n  UC Berkeley\n  2012-2016\n  Diploma obtained: Yes\n  Summa Cum Laude, Dean's List",
            skills: "Technical Skills:\n• Frontend: React, Vue.js, TypeScript, HTML/CSS, Tailwind\n• Backend: Node.js, Python, Java, PostgreSQL, MongoDB\n• Cloud: AWS, Docker, Kubernetes, Terraform\n• Tools: Git, Jenkins, Jira, Figma\n\nSoft Skills:\n• Team Leadership & Mentoring\n• Agile/Scrum Methodologies\n• Problem Solving & Critical Thinking\n• Technical Communication",
            achievements: "• Led migration of legacy monolith to microservices, reducing system downtime by 75%\n• Open source contributor to popular React library with 10k+ GitHub stars\n• Speaker at TechConf 2023: 'Building Scalable React Applications'\n• Recipient of 'Innovation Award' at TechCorp for implementing ML-based recommendation system\n• Volunteer coding instructor at local community center",
            targetJob: "Senior Frontend Developer",
            availability: "Available immediately, 40 hours per week",
            salaryIndication: "$90,000-$110,000 per year",
            preferredSector: "Technology, Fintech"
        },
        nl: {
            fullName: "Anna de Vries",
            email: "anna.devries@email.nl",
            phone: "+31 6 12345678",
            location: "Amsterdam, Nederland",
            birthDate: "15/03/1990",
            languages: "Nederlands (moedertaal)\nEngels (vloeiend mondeling en schriftelijk)\nDuits (conversatie mondeling, basis schriftelijk)",
            jobTitle: "Senior Software Ontwikkelaar",
            summary: "Ervaren software ontwikkelaar met 8+ jaar ervaring in full-stack development, gespecialiseerd in React, Node.js en cloud architectuur. Gepassioneerd over het creëren van schaalbare oplossingen en het begeleiden van junior ontwikkelaars.",
            experience: "• Senior Software Ontwikkelaar bij TechBedrijf\n  Maart 2020 - Heden\n  - Leidde ontwikkeling van microservices architectuur voor 1M+ gebruikers\n  - Verbeterde applicatie prestaties met 40% door optimalisatie\n  - Begeleidde team van 5 junior ontwikkelaars\n\n• Software Ontwikkelaar bij StartupXYZ\n  Juni 2018 - Februari 2020\n  - Bouwde responsieve webapplicaties met React en Redux\n  - Werkte samen met multidisciplinaire teams in Agile omgeving\n  - Implementeerde CI/CD pipelines met 60% snellere deployments",
            education: "• Master of Science in Informatica\n  Universiteit van Amsterdam\n  2016-2018\n  Diploma behaald: Ja\n  Gemiddeld: 8.5/10\n\n• Bachelor of Science in Software Engineering\n  TU Delft\n  2012-2016\n  Diploma behaald: Ja\n  Cum Laude, Dean's List",
            skills: "Technische Vaardigheden:\n• Frontend: React, Vue.js, TypeScript, HTML/CSS, Tailwind\n• Backend: Node.js, Python, Java, PostgreSQL, MongoDB\n• Cloud: AWS, Docker, Kubernetes, Terraform\n• Tools: Git, Jenkins, Jira, Figma\n\nSociale Vaardigheden:\n• Teamleiderschap & Mentoring\n• Agile/Scrum Methodologieën\n• Probleemoplossing & Kritisch Denken\n• Technische Communicatie",
            achievements: "• Leidde migratie van legacy monoliet naar microservices, 75% minder downtime\n• Open source contributor aan populaire React library met 10k+ GitHub stars\n• Spreker op TechConf 2023: 'Schaalbare React Applicaties Bouwen'\n• Ontvanger van 'Innovatie Award' bij TechBedrijf voor ML-based aanbevelingssysteem\n• Vrijwillige programmeer instructeur bij lokaal buurthuis",
            targetJob: "Senior Frontend Developer",
            availability: "Per direct beschikbaar, 40 uur per week",
            salaryIndication: "€65.000-€80.000 per jaar",
            preferredSector: "Technologie, Fintech"
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
                // Mark if this field should be excluded from CV
                if (input.getAttribute('data-exclude-from-cv') === 'true') {
                    formData[key + '_excludeFromCV'] = true;
                }
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
    nextBtn.addEventListener('click', function(e) {
        // Prevent click if button is disabled
        if (this.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        if (validateCurrentQuestion()) {
            saveCurrentAnswer();
            if (currentQuestion < totalQuestions - 1) {
                currentQuestion++;
                showQuestion(currentQuestion);
                updateProgress();
                updateNavigation();
            }
        } else {
            e.preventDefault();
            e.stopPropagation();
            return false;
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

        // Real-time validation feedback
        const input = e.target;
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
            // Apply date masking for birthDate field
            if (input.name === 'birthDate') {
                applyDateMask(input);
            }

            // Debounce validation to avoid too frequent checks
            // Only validate if field has been interacted with
            if (input.dataset.hasBeenTouched) {
                clearTimeout(input.validationTimeout);
                input.validationTimeout = setTimeout(() => {
                    validateInputRealTime(input);
                }, 500);
            }
        }
    });

    // Handle keydown for date field to support backspace
    form.addEventListener('keydown', function(e) {
        const input = e.target;
        if (input.name === 'birthDate') {
            handleDateKeydown(e, input);
        }
    });

    // Handle focus to initialize date template
    form.addEventListener('focus', function(e) {
        const input = e.target;
        if (input.name === 'birthDate') {
            if (!input.value || input.value === 'dd/mm/yyyy') {
                input.value = 'dd/mm/yyyy';
                input.setSelectionRange(0, 0);
            }
            updateDateInputColor(input);
        }
    }, true);

    // Mark fields as touched when user starts typing
    form.addEventListener('keydown', function(e) {
        const input = e.target;
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
            input.dataset.hasBeenTouched = 'true';
        }
    });

    function handleDateKeydown(e, input) {
        const key = e.key;
        const cursorPos = input.selectionStart;
        let value = input.value;

        // Initialize with template if empty
        if (!value || value === 'dd/mm/yyyy') {
            value = 'dd/mm/yyyy';
            input.value = value;
        }

        // Only allow digits and navigation keys
        if (!/[\d]/.test(key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
            e.preventDefault();
            return;
        }

        if (key === 'Backspace') {
            e.preventDefault();
            let newPos = cursorPos - 1;

            // Skip over slashes when going backwards
            if (newPos >= 0 && value[newPos] === '/') {
                newPos--;
            }

            if (newPos >= 0 && /\d/.test(value[newPos])) {
                // Replace digit with appropriate template character
                let templateChar = 'd';
                if (newPos === 3 || newPos === 4) templateChar = 'm';
                if (newPos >= 6) templateChar = 'y';

                const newValue = value.substring(0, newPos) + templateChar + value.substring(newPos + 1);
                input.value = newValue;
                input.setSelectionRange(newPos, newPos);
                updateDateInputColor(input);
                updateNextButton();
            }
            return;
        }

        if (key === 'Delete') {
            e.preventDefault();
            let pos = cursorPos;

            // Skip over slashes when going forward
            if (pos < value.length && value[pos] === '/') {
                pos++;
            }

            if (pos < value.length && value[pos] !== '/' && /\d/.test(value[pos])) {
                // Replace digit with appropriate template character
                let templateChar = 'd';
                if (pos === 3 || pos === 4) templateChar = 'm';
                if (pos >= 6) templateChar = 'y';

                const newValue = value.substring(0, pos) + templateChar + value.substring(pos + 1);
                input.value = newValue;
                input.setSelectionRange(cursorPos, cursorPos);
                updateDateInputColor(input);
                updateNextButton();
            }
            return;
        }

        // Handle digit input
        if (/\d/.test(key)) {
            e.preventDefault();
            let pos = cursorPos;

            // Skip over slashes
            if (pos < value.length && value[pos] === '/') {
                pos++;
            }

            // Only place digit if we're on a template character or digit position
            if (pos < value.length && (value[pos] === 'd' || value[pos] === 'm' || value[pos] === 'y' || /\d/.test(value[pos]))) {
                const newValue = value.substring(0, pos) + key + value.substring(pos + 1);
                input.value = newValue;

                // Move cursor to next position
                let newPos = pos + 1;
                if (newPos < newValue.length && newValue[newPos] === '/') {
                    newPos++;
                }
                input.setSelectionRange(newPos, newPos);
                updateDateInputColor(input);
                updateNextButton();
            }
        }
    }

    function updateDateInputColor(input) {
        // Check if any digits have been entered
        const hasDigits = /\d/.test(input.value);

        if (hasDigits) {
            input.classList.remove('template-mode');
            input.classList.add('typing-mode');
        } else {
            input.classList.remove('typing-mode');
            input.classList.add('template-mode');
        }
    }

    function applyDateMask(input) {
        // This function is now mostly handled by handleDateKeydown
        // But we keep it for initial setup
        if (!input.value || input.value === 'dd/mm/yyyy') {
            input.value = 'dd/mm/yyyy';
        }
    }

    function validateInputRealTime(input) {
        const value = input.value.trim();

        // Only validate if field has content
        if (!value) {
            input.classList.remove('error');
            const existingError = input.parentNode.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            return;
        }

        // Use same validation logic as main validation
        switch (input.name) {
            case 'fullName':
                if (!/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(value)) {
                    showValidationError(input, 'Naam mag alleen letters, spaties, apostrofes en koppeltekens bevatten (2-50 karakters)');
                } else {
                    showValidationSuccess(input);
                }
                break;

            case 'location':
                if (!/^[a-zA-ZÀ-ÿ\s,'-]{2,100}$/.test(value)) {
                    showValidationError(input, 'Locatie mag alleen letters, spaties, komma\'s, apostrofes en koppeltekens bevatten (2-100 karakters)');
                } else {
                    showValidationSuccess(input);
                }
                break;

            case 'email':
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                    showValidationError(input, 'Voer een geldig e-mailadres in');
                } else {
                    showValidationSuccess(input);
                }
                break;

            case 'phone':
                if (!/^[\+]?[0-9\s\-\(\)]{1,50}$/.test(value)) {
                    showValidationError(input, 'Voer een geldig telefoonnummer in (1-50 cijfers)');
                } else {
                    showValidationSuccess(input);
                }
                break;

            case 'birthDate':
                // Don't validate if incomplete (contains template characters)
                if (value.includes('d') || value.includes('m') || value.includes('y')) {
                    // Just remove error messages for incomplete dates
                    showValidationSuccess(input);
                    return;
                }
                if (!/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d{2}$/.test(value)) {
                    showValidationError(input, 'Voer een geldige geboortedatum in (dd/mm/yyyy)');
                } else {
                    // Check if date is realistic
                    const [day, month, year] = value.split('/');
                    const birthDate = new Date(year, month - 1, day);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (birthDate > today) {
                        showValidationError(input, 'Geboortedatum kan niet in de toekomst liggen');
                    } else if (age > 120) {
                        showValidationError(input, 'Geboortedatum lijkt niet realistisch');
                    } else {
                        showValidationSuccess(input);
                    }
                }
                break;
        }
    }
    
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

        // Update button state for new question
        updateNavigation();
    }
    
    function validateCurrentQuestion() {
        const currentQuestionElement = questions[currentQuestion];
        const input = currentQuestionElement.querySelector('input, textarea');

        if (!input) return true; // No input to validate (final screen)

        // Clear previous validation states
        input.classList.remove('error');

        const value = input.value.trim();

        // Required field validation
        if (input.hasAttribute('required')) {
            // Special handling for date field
            if (input.name === 'birthDate') {
                const isCompleteDate = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(value);
                if (!isCompleteDate) {
                    showValidationError(input, 'Dit veld is verplicht');
                    return false;
                }
            }
            // Regular handling for other fields
            else if (input.name !== 'birthDate' && !value) {
                showValidationError(input, 'Dit veld is verplicht');
                return false;
            }
        }

        // Specific validation based on input type/name
        switch (input.name) {
            case 'fullName':
                if (!/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(value)) {
                    showValidationError(input, 'Naam mag alleen letters, spaties, apostrofes en koppeltekens bevatten (2-50 karakters)');
                    return false;
                }
                break;

            case 'location':
                if (!/^[a-zA-ZÀ-ÿ\s,'-]{2,100}$/.test(value)) {
                    showValidationError(input, 'Locatie mag alleen letters, spaties, komma\'s, apostrofes en koppeltekens bevatten (2-100 karakters)');
                    return false;
                }
                break;

            case 'email':
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                    showValidationError(input, 'Voer een geldig e-mailadres in');
                    return false;
                }
                break;

            case 'phone':
                if (!/^[\+]?[0-9\s\-\(\)]{1,50}$/.test(value)) {
                    showValidationError(input, 'Voer een geldig telefoonnummer in (1-50 cijfers)');
                    return false;
                }
                break;

            case 'birthDate':
                // Check if the format contains template characters (incomplete)
                if (value.includes('d') || value.includes('m') || value.includes('y')) {
                    showValidationError(input, 'Vul de volledige geboortedatum in');
                    return false;
                }
                if (!/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d{2}$/.test(value)) {
                    showValidationError(input, 'Voer een geldige geboortedatum in (dd/mm/yyyy)');
                    return false;
                }
                // Check if date is realistic (not in future, not too old)
                const [day, month, year] = value.split('/');
                const birthDate = new Date(year, month - 1, day);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (birthDate > today) {
                    showValidationError(input, 'Geboortedatum kan niet in de toekomst liggen');
                    return false;
                }
                if (age > 120) {
                    showValidationError(input, 'Geboortedatum lijkt niet realistisch');
                    return false;
                }
                break;
        }

        showValidationSuccess(input);
        return true;
    }

    function showValidationError(input, message) {
        input.classList.add('error');

        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message show';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);

        input.focus();
    }

    function showValidationSuccess(input) {
        // Remove any error messages
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    function saveCurrentAnswer() {
        const currentQuestionElement = questions[currentQuestion];
        const input = currentQuestionElement.querySelector('input, textarea');

        if (input && input.name) {
            formData[input.name] = input.value.trim();
            // Mark if this field should be excluded from CV
            if (input.getAttribute('data-exclude-from-cv') === 'true') {
                formData[input.name + '_excludeFromCV'] = true;
            }
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
        const t = translations[currentLanguage];

        // Force disable first, then enable only if valid
        nextBtn.disabled = true;


        // Use the same validation logic as validateCurrentQuestion for consistency
        const currentQuestionElement = questions[currentQuestion];
        const input = currentQuestionElement.querySelector('input, textarea');

        if (!input) {
            nextBtn.disabled = false;
            return;
        }

        const value = input.value.trim();

        // Use same validation logic as validateCurrentQuestion
        let isValid = true;

        // Required field validation
        if (input.hasAttribute('required')) {
            // Special handling for date field
            if (input.name === 'birthDate') {
                const isCompleteDate = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(value);
                isValid = isCompleteDate;
            }
            // Regular handling for other fields
            else if (input.name !== 'birthDate' && !value) {
                isValid = false;
            }
        }

        // Additional specific validation
        if (isValid && input.hasAttribute('required')) {
            switch (input.name) {
                case 'fullName':
                    isValid = value.length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/.test(value);
                    break;
                case 'email':
                    isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
                    break;
                case 'phone':
                    isValid = /^[\+]?[0-9\s\-\(\)]{1,50}$/.test(value);
                    break;
                case 'location':
                    isValid = /^[a-zA-ZÀ-ÿ\s,'-]{2,100}$/.test(value);
                    break;
            }
        }

        // Only enable if truly valid
        if (isValid) {
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
                    ${formData.birthDate ? `<span>Born: ${formatDate(formData.birthDate)}</span>` : ''}
                </div>
            </div>
            
            ${formData.summary ? `
                <div class="cv-section">
                    <div class="cv-section-title">${t['cv-section-summary']}</div>
                    <div class="cv-content">${formData.summary}</div>
                </div>
            ` : ''}

            ${formData.languages ? `
                <div class="cv-section">
                    <div class="cv-section-title">${currentLanguage === 'en' ? 'Languages' : 'Talen'}</div>
                    <div class="cv-content">${formData.languages}</div>
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

        // Update button tooltips when language changes
        updateNextButton();
        if (document.getElementById('feedbackMessage')) {
            updateFeedbackSubmitButton();
        }
    }
    
    // Feedback functionality
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedback = document.querySelector('.close-feedback');
    const cancelFeedback = document.getElementById('cancelFeedback');
    const feedbackForm = document.getElementById('feedbackForm');
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;

    // Show feedback modal
    feedbackBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'block';
        updateFeedbackSubmitButton(); // Check initial state
    });

    // Close feedback modal
    function closeFeedbackModal() {
        feedbackModal.style.display = 'none';
        feedbackForm.reset();
        selectedRating = 0;
        stars.forEach(star => star.classList.remove('active'));
        document.getElementById('feedbackRating').value = '';
    }

    closeFeedback.addEventListener('click', closeFeedbackModal);
    cancelFeedback.addEventListener('click', closeFeedbackModal);

    // Star rating functionality
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            document.getElementById('feedbackRating').value = selectedRating;

            stars.forEach((s, index) => {
                if (index < selectedRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.style.color = '#ffd700';
                } else {
                    s.style.color = '#e2e8f0';
                }
            });
        });
    });

    // Reset star colors on mouse leave
    document.querySelector('.rating-stars').addEventListener('mouseleave', () => {
        stars.forEach((s, index) => {
            if (index < selectedRating) {
                s.style.color = '#ffd700';
            } else {
                s.style.color = '#e2e8f0';
            }
        });
    });

    // Validate feedback form and update submit button
    function updateFeedbackSubmitButton() {
        const submitBtn = document.getElementById('submitFeedback');
        const messageField = document.getElementById('feedbackMessage');
        const t = translations[currentLanguage];

        if (messageField.value.trim()) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('data-tooltip');
        } else {
            submitBtn.disabled = true;
            submitBtn.setAttribute('data-tooltip', t['tooltip-feedback-required']);
        }
    }

    // Add event listener to feedback message field
    document.getElementById('feedbackMessage').addEventListener('input', updateFeedbackSubmitButton);
    document.getElementById('feedbackMessage').addEventListener('blur', updateFeedbackSubmitButton);

    // Submit feedback
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitFeedback');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = currentLanguage === 'en' ? 'Sending...' : 'Versturen...';

            const feedbackData = {
                feedbackName: document.getElementById('feedbackName').value,
                feedbackEmail: document.getElementById('feedbackEmail').value,
                feedbackRating: document.getElementById('feedbackRating').value,
                feedbackMessage: document.getElementById('feedbackMessage').value
            };

            const response = await fetch('/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });

            const result = await response.json();

            if (result.success) {
                // Show success message
                const t = translations[currentLanguage];
                alert(currentLanguage === 'en' ? 'Thank you for your feedback!' : 'Bedankt voor je feedback!');
                closeFeedbackModal();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert(currentLanguage === 'en' ? 'Failed to submit feedback. Please try again.' : 'Kon feedback niet versturen. Probeer opnieuw.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // Close modal when clicking outside
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            closeFeedbackModal();
        }
    });

    // Initialize
    updateNavigation();
    updateProgress();


    // Add touched state tracking to all input fields
    document.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('blur', function() {
            this.setAttribute('data-has-been-touched', 'true');
        });

        field.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.setAttribute('data-has-been-touched', 'true');
            }
            // Update next button when user types (only if it's the current question's field)
            const currentQuestionElement = questions[currentQuestion];
            if (currentQuestionElement && currentQuestionElement.contains(this)) {
                updateNextButton();
            }
        });
    });
    
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