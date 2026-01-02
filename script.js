document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('questionnaire');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const backToChoiceNav = document.getElementById('backToChoiceNav');
    const progress = document.getElementById('progress');
    const generateBtn = document.getElementById('generateCV');
    const modal = document.getElementById('cvModal');
    const closeModal = document.querySelector('.close');
    const downloadBtn = document.getElementById('downloadCV');
    const langButtons = document.querySelectorAll('.lang-btn[data-lang]');
    const demoBtn = document.getElementById('demoBtn');
    
    let currentQuestion = 0;
    const totalQuestions = 17; // 0-16
    const formData = {};
    let currentLanguage = 'nl';
    
    const questions = document.querySelectorAll('.question-container[data-question]:not([data-question="-1"])');

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
            'phone-placeholder': "+597 123-4567",
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
            'lang-toggle': "→ NL",
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
            'view-cv-btn': "View & Edit my CV",
            'edit-cv-btn': "Edit CV",
            'save-cv-btn': "Save Changes",
            'resubmit-cv-btn': "Submit CV",
            'cv-saved': "Changes saved!",
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
            'tooltip-feedback-required': "Please provide your feedback message",
            'find-vacancies': "Find Vacancies",
            'searching': "Searching...",
            'finding-vacancies': "Finding vacancies that match your profile...",
            'matching-vacancies': "Matching Vacancies",
            'no-vacancies': "No matching vacancies found at the moment.",
            'check-later': "Check back later, new vacancies are added regularly!",
            'error-vacancies': "Error fetching vacancies. Please try again later.",
            'choice-title': "How would you like to create your CV?",
            'choice-upload-title': "I have a CV, upload it",
            'choice-upload-desc': "Upload your PDF or Word document and we'll fill in the form automatically with AI",
            'choice-manual-title': "I don't have a CV, create one",
            'choice-manual-desc': "Answer questions step by step to build your CV from scratch",
            'upload-title': "Upload your CV",
            'back-to-choice': "← Back to choice",
            'upload-text': "Drag & drop your CV here or click to browse",
            'upload-formats': "Supported: PDF, Word (.docx)",
            'parsing-cv': "Analyzing your CV with AI...",
            'cv-parsed-success': "CV successfully analyzed! Filling in the form...",
            'cv-filled-success': "Form filled! Review and continue.",
            'cv-upload-complete': "CV uploaded and parsed successfully!",
            'cv-parse-error': "Error analyzing CV. Please try again or fill in manually.",
            'upload-error-format': "Please upload a PDF or Word document (.docx)",
            'back-to-choice-nav': "← Back to choice"
        },
        nl: {
            'start-title': "Laten we beginnen met je persoonlijke gegevens",
            'fullname-label': "Wat is je volledige naam?",
            'fullname-placeholder': "Voer je volledige naam in",
            'email-label': "Wat is je e-mailadres?",
            'email-placeholder': "jouw.email@voorbeeld.nl",
            'phone-label': "Wat is je telefoonnummer?",
            'phone-placeholder': "+597 123-4567",
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
            'lang-toggle': "→ ES",
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
            'view-cv-btn': "Bekijk & Bewerk mijn CV",
            'edit-cv-btn': "CV bewerken",
            'save-cv-btn': "Wijzigingen opslaan",
            'resubmit-cv-btn': "CV versturen",
            'cv-saved': "Wijzigingen opgeslagen!",
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
            'tooltip-feedback-required': "Geef je feedback bericht",
            'find-vacancies': "Zoek Vacatures",
            'searching': "Zoeken...",
            'finding-vacancies': "Vacatures zoeken die bij jouw profiel passen...",
            'matching-vacancies': "Passende Vacatures",
            'no-vacancies': "Geen passende vacatures gevonden op dit moment.",
            'check-later': "Kom later terug, er worden regelmatig nieuwe vacatures toegevoegd!",
            'error-vacancies': "Fout bij ophalen vacatures. Probeer het later opnieuw.",
            'choice-title': "Hoe wil je je CV maken?",
            'choice-upload-title': "Ik heb al een CV, uploaden",
            'choice-upload-desc': "Upload je PDF of Word document en wij vullen het formulier automatisch in met AI",
            'choice-manual-title': "Ik heb geen CV, maak er eentje aan",
            'choice-manual-desc': "Beantwoord stap voor stap vragen om je CV op te bouwen",
            'upload-title': "Upload je CV",
            'back-to-choice': "← Terug naar keuze",
            'upload-text': "Sleep je CV hierheen of klik om te bladeren",
            'upload-formats': "Ondersteund: PDF, Word (.docx)",
            'parsing-cv': "Je CV wordt geanalyseerd met AI...",
            'cv-parsed-success': "CV succesvol geanalyseerd! Formulier wordt ingevuld...",
            'cv-filled-success': "Formulier ingevuld! Controleer en ga verder.",
            'cv-upload-complete': "CV geüpload en verwerkt!",
            'cv-parse-error': "Fout bij analyseren CV. Probeer opnieuw of vul handmatig in.",
            'upload-error-format': "Upload een PDF of Word document (.docx)",
            'back-to-choice-nav': "← Terug naar keuze"
        },
        es: {
            'start-title': "Comencemos con tu información personal",
            'fullname-label': "¿Cuál es tu nombre completo?",
            'fullname-placeholder': "Ingresa tu nombre completo",
            'email-label': "¿Cuál es tu correo electrónico?",
            'email-placeholder': "tu.correo@ejemplo.com",
            'phone-label': "¿Cuál es tu número de teléfono?",
            'phone-placeholder': "+34 612 345 678",
            'location-label': "¿Dónde vives?",
            'location-placeholder': "Ciudad, País",
            'birthdate-label': "¿Cuál es tu fecha de nacimiento?",
            'languages-label': "¿Qué idiomas hablas y a qué nivel?",
            'languages-placeholder': "Por ejemplo: Español (nativo), Inglés (fluido oral y escrito), Francés (básico oral)...",
            'jobtitle-label': "¿Cuál es tu puesto actual o deseado?",
            'jobtitle-placeholder': "Desarrollador de Software, Gerente de Marketing, etc.",
            'summary-label': "Cuéntanos sobre ti en unas pocas frases",
            'summary-placeholder': "Un breve resumen profesional destacando tus principales fortalezas y experiencia...",
            'experience-label': "Describe tu experiencia laboral con períodos",
            'experience-placeholder': "Indica por cada puesto: Título del puesto, Nombre de la empresa, Período (desde-hasta), Tareas y responsabilidades. Por ejemplo:\n\n• Desarrollador de Software en TechEmpresa\n  Enero 2020 - Presente\n  - Desarrollo de aplicaciones web\n  - Colaboración con el equipo de diseño...",
            'education-label': "¿Cuál es tu formación académica?",
            'education-placeholder': "Indica por cada formación: Nombre del título, Institución, Período, Título obtenido (sí/no). Por ejemplo:\n\n• Grado en Informática\n  Universidad de Madrid\n  2016-2020\n  Título obtenido: Sí\n\n• Máster en Desarrollo Web\n  Universidad de Barcelona\n  2020-2022\n  Título obtenido: Sí...",
            'skills-label': "¿Cuáles son tus habilidades principales?",
            'skills-placeholder': "Lista tus habilidades técnicas, habilidades blandas, idiomas, certificaciones...",
            'achievements-label': "¿Tienes logros o proyectos destacados?",
            'achievements-placeholder': "Premios, proyectos exitosos, publicaciones, voluntariado...",
            'targetjob-label': "¿Qué puesto estás buscando?",
            'targetjob-placeholder': "Por ejemplo: Desarrollador Frontend, Gerente de Marketing...",
            'availability-label': "¿Cuándo estás disponible y cuántas horas por semana?",
            'availability-placeholder': "Por ejemplo: Disponible inmediatamente, 40 horas por semana...",
            'salary-label': "¿Indicación salarial?",
            'salary-placeholder': "Por ejemplo: €3000-4000 al mes, €50.000-60.000 al año...",
            'sector-label': "¿En qué sector quieres trabajar?",
            'sector-placeholder': "Por ejemplo: IT, Marketing, Finanzas, Salud...",
            'complete-title': "¡Perfecto! Tu CV está listo",
            'complete-description': "Hemos recopilado toda la información necesaria para crear tu CV profesional.",
            'submit-btn': "Enviar CV",
            'prev-btn': "← Anterior",
            'next-btn': "Continuar →",
            'download-btn': "Descargar PDF",
            'lang-toggle': "→ EN",
            'cv-section-summary': "Resumen Profesional",
            'cv-section-experience': "Experiencia Laboral",
            'cv-section-education': "Formación Académica",
            'cv-section-skills': "Habilidades",
            'cv-section-achievements': "Logros y Proyectos",
            'success-title': "✅ ¡CV Enviado Exitosamente!",
            'success-message': "Gracias por enviar tu CV. Ha sido enviado y pronto recibirás noticias.",
            'success-button': "Enviar Otro CV",
            'error-title': "❌ Error al Enviar",
            'error-button': "Intentar de Nuevo",
            'submitting': "Enviando...",
            'view-cv-btn': "Ver y Editar mi CV",
            'edit-cv-btn': "Editar CV",
            'save-cv-btn': "Guardar Cambios",
            'resubmit-cv-btn': "Enviar CV",
            'cv-saved': "¡Cambios guardados!",
            'demo-btn': "🎯 Demo",
            'feedback-btn': "💬 Feedback",
            'feedback-title': "Comparte tu Opinión",
            'feedback-description': "Ayúdanos a mejorar el cuestionario de CV compartiendo tus pensamientos.",
            'feedback-name-label': "Tu Nombre (Opcional)",
            'feedback-name-placeholder': "Ingresa tu nombre",
            'feedback-email-label': "Tu Email (Opcional)",
            'feedback-email-placeholder': "tu.correo@ejemplo.com",
            'feedback-rating-label': "¿Cómo calificarías tu experiencia?",
            'feedback-message-label': "Tu Opinión",
            'feedback-message-placeholder': "Cuéntanos qué piensas del cuestionario, qué se podría mejorar, o qué te gustó...",
            'feedback-cancel': "Cancelar",
            'feedback-submit': "Enviar Opinión",
            'tooltip-feedback-required': "Por favor proporciona tu mensaje de feedback",
            'find-vacancies': "Buscar Vacantes",
            'searching': "Buscando...",
            'finding-vacancies': "Buscando vacantes que coincidan con tu perfil...",
            'matching-vacancies': "Vacantes Coincidentes",
            'no-vacancies': "No se encontraron vacantes coincidentes en este momento.",
            'check-later': "¡Vuelve más tarde, se añaden nuevas vacantes regularmente!",
            'error-vacancies': "Error al obtener vacantes. Por favor, inténtalo más tarde.",
            'choice-title': "¿Cómo quieres crear tu CV?",
            'choice-upload-title': "Tengo un CV, subirlo",
            'choice-upload-desc': "Sube tu documento PDF o Word y completaremos el formulario automáticamente con IA",
            'choice-manual-title': "No tengo CV, crear uno",
            'choice-manual-desc': "Responde preguntas paso a paso para crear tu CV desde cero",
            'upload-title': "Sube tu CV",
            'back-to-choice': "← Volver a elegir",
            'upload-text': "Arrastra tu CV aquí o haz clic para buscar",
            'upload-formats': "Formatos: PDF, Word (.docx)",
            'parsing-cv': "Analizando tu CV con IA...",
            'cv-parsed-success': "¡CV analizado con éxito! Completando el formulario...",
            'cv-filled-success': "¡Formulario completado! Revisa y continúa.",
            'cv-upload-complete': "¡CV subido y procesado!",
            'cv-parse-error': "Error al analizar CV. Intenta de nuevo o completa manualmente.",
            'upload-error-format': "Por favor sube un documento PDF o Word (.docx)",
            'back-to-choice-nav': "← Volver a elegir"
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
        },
        es: {
            fullName: "María García López",
            email: "maria.garcia@email.es",
            phone: "+34 612 345 678",
            location: "Madrid, España",
            birthDate: "15/03/1990",
            languages: "Español (nativo)\nInglés (fluido oral y escrito)\nFrancés (conversación oral, básico escrito)",
            jobTitle: "Ingeniera de Software Senior",
            summary: "Ingeniera de software con más de 8 años de experiencia en desarrollo full-stack, especializada en React, Node.js y arquitectura cloud. Apasionada por crear soluciones escalables y mentorizar a desarrolladores junior.",
            experience: "• Ingeniera de Software Senior en TechEmpresa\n  Marzo 2020 - Presente\n  - Lideré el desarrollo de arquitectura de microservicios para 1M+ usuarios\n  - Mejoré el rendimiento de la aplicación en un 40% mediante optimización\n  - Mentoricé a un equipo de 5 desarrolladores junior\n\n• Ingeniera de Software en StartupXYZ\n  Junio 2018 - Febrero 2020\n  - Construí aplicaciones web responsivas usando React y Redux\n  - Colaboré con equipos multifuncionales en entorno Agile\n  - Implementé pipelines CI/CD reduciendo el tiempo de despliegue en un 60%",
            education: "• Máster en Ciencias de la Computación\n  Universidad Politécnica de Madrid\n  2016-2018\n  Título obtenido: Sí\n  Nota media: 9.2/10\n\n• Grado en Ingeniería Informática\n  Universidad Complutense de Madrid\n  2012-2016\n  Título obtenido: Sí\n  Matrícula de Honor, Premio Extraordinario",
            skills: "Habilidades Técnicas:\n• Frontend: React, Vue.js, TypeScript, HTML/CSS, Tailwind\n• Backend: Node.js, Python, Java, PostgreSQL, MongoDB\n• Cloud: AWS, Docker, Kubernetes, Terraform\n• Herramientas: Git, Jenkins, Jira, Figma\n\nHabilidades Blandas:\n• Liderazgo de Equipo & Mentoría\n• Metodologías Agile/Scrum\n• Resolución de Problemas & Pensamiento Crítico\n• Comunicación Técnica",
            achievements: "• Lideré la migración de monolito legacy a microservicios, reduciendo el tiempo de inactividad en un 75%\n• Contribuidora open source a librería React popular con 10k+ estrellas en GitHub\n• Ponente en TechConf 2023: 'Construyendo Aplicaciones React Escalables'\n• Receptora del 'Premio a la Innovación' en TechEmpresa por implementar sistema de recomendación basado en ML\n• Instructora voluntaria de programación en centro comunitario local",
            targetJob: "Senior Frontend Developer",
            availability: "Disponible inmediatamente, 40 horas por semana",
            salaryIndication: "€55.000-€70.000 al año",
            preferredSector: "Tecnología, Fintech"
        }
    };

    // Language buttons functionality
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentLanguage = this.getAttribute('data-lang');
            updateLanguage();
            updateActiveLanguageButton();
            localStorage.setItem('preferredLanguage', currentLanguage);
        });
    });

    function updateActiveLanguageButton() {
        langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === currentLanguage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
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

    // Choice screen elements
    const choiceScreen = document.getElementById('choiceScreen');
    const uploadScreen = document.getElementById('uploadScreen');
    const choiceUpload = document.getElementById('choiceUpload');
    const choiceManual = document.getElementById('choiceManual');
    const backToChoiceBtn = document.getElementById('backToChoice');

    // Start at choice screen (hide navigation buttons)
    currentQuestion = -1;

    // Make sure all question containers are hidden initially
    questions.forEach(q => {
        q.style.display = 'none';
        q.classList.remove('active');
    });
    // Make sure upload screen is hidden
    if (uploadScreen) {
        uploadScreen.style.display = 'none';
        uploadScreen.classList.remove('active');
    }
    // Make sure choice screen is visible
    if (choiceScreen) {
        choiceScreen.classList.add('active');
    }

    updateNavigation();
    updateProgress();

    // Choice: Upload CV
    if (choiceUpload) {
        choiceUpload.addEventListener('click', function() {
            choiceScreen.classList.remove('active');
            // Hide all question containers
            questions.forEach(q => {
                q.style.display = 'none';
                q.classList.remove('active');
            });
            // Show upload screen
            uploadScreen.style.display = 'block';
            uploadScreen.classList.add('active');
        });
    }

    // Choice: Manual questionnaire
    if (choiceManual) {
        choiceManual.addEventListener('click', function() {
            choiceScreen.classList.remove('active');
            // Make sure upload screen is hidden
            if (uploadScreen) {
                uploadScreen.classList.remove('active');
                uploadScreen.style.display = 'none';
            }
            currentQuestion = 0;
            showQuestion(0);
            updateProgress();
            updateNavigation();
            // Track manual choice
            if (window.jpTrack) {
                window.jpTrack('cv_manual');
            }
        });
    }

    // Back to choice screen
    if (backToChoiceBtn) {
        backToChoiceBtn.addEventListener('click', function() {
            // Hide upload screen
            uploadScreen.classList.remove('active');
            uploadScreen.style.display = 'none';
            // Hide all question containers
            questions.forEach(q => {
                q.style.display = 'none';
                q.classList.remove('active');
            });
            // Show choice screen
            choiceScreen.classList.add('active');
            currentQuestion = -1;
            updateProgress();
            updateNavigation();
            // Reset upload state
            const uploadBox = document.getElementById('uploadBox');
            const uploadStatus = document.getElementById('uploadStatus');
            if (uploadBox) uploadBox.style.display = 'block';
            if (uploadStatus) {
                uploadStatus.style.display = 'none';
                uploadStatus.classList.remove('upload-success', 'upload-error');
            }
        });
    }

    // Back to choice from questionnaire navigation
    backToChoiceNav.addEventListener('click', function() {
        // Hide current question
        questions.forEach(q => {
            q.style.display = 'none';
            q.classList.remove('active');
        });
        // Hide upload screen
        if (uploadScreen) {
            uploadScreen.style.display = 'none';
            uploadScreen.classList.remove('active');
        }
        // Show choice screen
        choiceScreen.classList.add('active');
        currentQuestion = -1;
        updateProgress();
        updateNavigation();
    });

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
                // Use setTimeout to ensure cursor position is set after browser defaults
                setTimeout(() => {
                    input.setSelectionRange(0, 0);
                }, 0);
            } else {
                // If field has content, still set cursor to beginning
                setTimeout(() => {
                    input.setSelectionRange(0, 0);
                }, 0);
            }
            updateDateInputColor(input);
        }
    }, true);

    // Handle click to reset cursor position for birth date
    form.addEventListener('click', function(e) {
        const input = e.target;
        if (input.name === 'birthDate') {
            setTimeout(() => {
                input.setSelectionRange(0, 0);
            }, 0);
        }
    });

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

    // Edit CV button (before submit)
    const editCVBtn = document.getElementById('editCVBtn');
    editCVBtn.addEventListener('click', function() {
        saveCurrentAnswer();
        generateEditableCV();
        modal.style.display = 'block';
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
        // Hide choice and upload screens
        const choiceScreen = document.getElementById('choiceScreen');
        const uploadScreen = document.getElementById('uploadScreen');
        if (choiceScreen) choiceScreen.classList.remove('active');
        if (uploadScreen) {
            uploadScreen.classList.remove('active');
            uploadScreen.style.display = 'none';
        }

        // Show the correct question
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
        if (currentQuestion < 0 || currentQuestion >= questions.length) return true;
        const currentQuestionElement = questions[currentQuestion];
        if (!currentQuestionElement) return true;
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
        if (currentQuestion < 0 || currentQuestion >= questions.length) return;
        const currentQuestionElement = questions[currentQuestion];
        if (!currentQuestionElement) return;
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
        // Hide navigation on choice/upload screens
        if (currentQuestion < 0) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            backToChoiceNav.style.display = 'none';
            return;
        }

        // Show/hide previous button and back to choice button
        if (currentQuestion === 0) {
            prevBtn.style.display = 'none';
            backToChoiceNav.style.display = 'inline-block';
        } else {
            prevBtn.style.display = 'inline-block';
            backToChoiceNav.style.display = 'none';
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

        // Guard for choice/upload screens
        if (currentQuestion < 0 || currentQuestion >= questions.length) return;

        // Use the same validation logic as validateCurrentQuestion for consistency
        const currentQuestionElement = questions[currentQuestion];
        if (!currentQuestionElement) return;
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

    function generateEditableCV() {
        const cvPreview = document.getElementById('cvPreview');
        const t = translations[currentLanguage];

        const cvHTML = `
            <div class="cv-header">
                <div class="cv-name">
                    <input type="text" class="cv-edit-field cv-edit-name" data-field="fullName" value="${formData.fullName || ''}" placeholder="${t['fullname-placeholder']}">
                </div>
                <div class="cv-title">
                    <input type="text" class="cv-edit-field cv-edit-title" data-field="jobTitle" value="${formData.jobTitle || ''}" placeholder="${t['jobtitle-placeholder']}">
                </div>
                <div class="cv-contact-edit">
                    <div class="cv-contact-row">
                        <label>${t['email-label']}</label>
                        <input type="email" class="cv-edit-field" data-field="email" value="${formData.email || ''}" placeholder="${t['email-placeholder']}">
                    </div>
                    <div class="cv-contact-row">
                        <label>${t['phone-label']}</label>
                        <input type="tel" class="cv-edit-field" data-field="phone" value="${formData.phone || ''}" placeholder="${t['phone-placeholder']}">
                    </div>
                    <div class="cv-contact-row">
                        <label>${t['location-label']}</label>
                        <input type="text" class="cv-edit-field" data-field="location" value="${formData.location || ''}" placeholder="${t['location-placeholder']}">
                    </div>
                    <div class="cv-contact-row">
                        <label>${t['birthdate-label']}</label>
                        <input type="text" class="cv-edit-field" data-field="birthDate" value="${formData.birthDate || ''}" placeholder="dd/mm/yyyy">
                    </div>
                </div>
            </div>

            <div class="cv-section">
                <div class="cv-section-title">${t['cv-section-summary']}</div>
                <textarea class="cv-edit-field cv-edit-textarea" data-field="summary" placeholder="${t['summary-placeholder']}">${formData.summary || ''}</textarea>
            </div>

            <div class="cv-section">
                <div class="cv-section-title">${currentLanguage === 'en' ? 'Languages' : 'Talen'}</div>
                <textarea class="cv-edit-field cv-edit-textarea" data-field="languages" placeholder="${t['languages-placeholder']}">${formData.languages || ''}</textarea>
            </div>

            <div class="cv-section">
                <div class="cv-section-title">${t['cv-section-experience']}</div>
                <textarea class="cv-edit-field cv-edit-textarea cv-edit-large" data-field="experience" placeholder="${t['experience-placeholder']}">${formData.experience || ''}</textarea>
            </div>

            <div class="cv-section">
                <div class="cv-section-title">${t['cv-section-education']}</div>
                <textarea class="cv-edit-field cv-edit-textarea cv-edit-large" data-field="education" placeholder="${t['education-placeholder']}">${formData.education || ''}</textarea>
            </div>

            <div class="cv-section">
                <div class="cv-section-title">${t['cv-section-skills']}</div>
                <textarea class="cv-edit-field cv-edit-textarea" data-field="skills" placeholder="${t['skills-placeholder']}">${formData.skills || ''}</textarea>
            </div>

            <div class="cv-section">
                <div class="cv-section-title">${t['cv-section-achievements']}</div>
                <textarea class="cv-edit-field cv-edit-textarea" data-field="achievements" placeholder="${t['achievements-placeholder']}">${formData.achievements || ''}</textarea>
            </div>

            <div class="cv-edit-actions">
                <button type="button" id="saveCVBtn" class="save-cv-btn">${t['save-cv-btn']}</button>
                <button type="button" id="resubmitCVBtn" class="resubmit-cv-btn">${t['resubmit-cv-btn']}</button>
            </div>
        `;

        cvPreview.innerHTML = cvHTML;

        // Update download button to be hidden in edit mode
        downloadBtn.style.display = 'none';

        // Add save button handler
        document.getElementById('saveCVBtn').addEventListener('click', function() {
            saveEditedCV();
            const t = translations[currentLanguage];
            this.textContent = t['cv-saved'];
            this.classList.add('saved');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 800);
        });

        // Add resubmit button handler
        document.getElementById('resubmitCVBtn').addEventListener('click', async function() {
            saveEditedCV();
            this.disabled = true;
            this.textContent = translations[currentLanguage]['submitting'];

            try {
                const response = await fetch('/submit-cv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...formData, language: currentLanguage })
                });

                const result = await response.json();

                if (result.success) {
                    const t = translations[currentLanguage];
                    this.textContent = t['success-title'];
                    this.classList.add('saved');
                    setTimeout(() => {
                        this.textContent = t['resubmit-cv-btn'];
                        this.classList.remove('saved');
                        this.disabled = false;
                    }, 2000);
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                console.error('Resubmit error:', error);
                alert(currentLanguage === 'en' ? 'Failed to resubmit. Please try again.' : 'Opnieuw versturen mislukt. Probeer opnieuw.');
                this.textContent = translations[currentLanguage]['resubmit-cv-btn'];
                this.disabled = false;
            }
        });
    }

    function saveEditedCV() {
        // Get all editable fields and update formData
        document.querySelectorAll('.cv-edit-field').forEach(field => {
            const fieldName = field.getAttribute('data-field');
            if (fieldName) {
                formData[fieldName] = field.value.trim();
            }
        });
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
                body: JSON.stringify({ ...formData, language: currentLanguage })
            });

            const result = await response.json();

            if (result.success) {
                showSuccessMessage(result.cvId);
                // Track CV submission
                if (window.jpTrack) {
                    window.jpTrack('cv_submission', { cvId: result.cvId });
                }
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
    
    let submittedCvId = null;

    function showSuccessMessage(cvId) {
        submittedCvId = cvId;
        if (currentQuestion < 0 || currentQuestion >= questions.length) return;
        const currentQuestionElement = questions[currentQuestion];
        if (!currentQuestionElement) return;
        const t = translations[currentLanguage];
        currentQuestionElement.innerHTML = `
            <div class="question completed">
                <h2 data-text="success-title">${t['success-title']}</h2>
                <p data-text="success-message">${t['success-message']}</p>
                <div class="success-buttons">
                    <button type="button" id="viewCVBtn" class="generate-btn view-cv-btn" data-text="view-cv-btn">${t['view-cv-btn']}</button>
                    ${cvId ? `<button type="button" id="findVacanciesBtn" class="generate-btn find-vacancies-btn">🔍 ${t['find-vacancies'] || 'Zoek Vacatures'}</button>` : ''}
                </div>
                <div id="matchingVacancies" class="matching-vacancies" style="display: none;"></div>
            </div>
        `;

        // Add click handler for View CV button
        document.getElementById('viewCVBtn').addEventListener('click', function() {
            generateEditableCV();
            modal.style.display = 'block';
        });

        // Add click handler for Find Vacancies button
        if (cvId) {
            document.getElementById('findVacanciesBtn').addEventListener('click', function() {
                findMatchingVacancies(cvId);
            });
        }
    }

    async function findMatchingVacancies(cvId) {
        const container = document.getElementById('matchingVacancies');
        const btn = document.getElementById('findVacanciesBtn');
        const t = translations[currentLanguage];

        btn.disabled = true;
        btn.textContent = '⏳ ' + (t['searching'] || 'Zoeken...');

        container.style.display = 'block';
        container.innerHTML = `
            <div class="vacancies-loading">
                <div class="loading-spinner"></div>
                <p>${t['finding-vacancies'] || 'Vacatures zoeken die bij jouw profiel passen...'}</p>
            </div>
        `;

        try {
            const response = await fetch(`/api/cvs/${cvId}/matching-vacancies?lang=${currentLanguage}`);
            const result = await response.json();

            if (result.success && result.matches && result.matches.length > 0) {
                container.innerHTML = `
                    <h3 class="vacancies-title">🎯 ${t['matching-vacancies'] || 'Passende Vacatures'} (${result.matches.length})</h3>
                    <div class="vacancies-grid">
                        ${result.matches.map(v => `
                            <div class="vacancy-card">
                                <div class="vacancy-match-score">${v.matchScore}% match</div>
                                <h4 class="vacancy-title">${escapeHtml(v.title)}</h4>
                                ${v.location ? `<p class="vacancy-location">📍 ${escapeHtml(v.location)}</p>` : ''}
                                ${v.description ? `<p class="vacancy-description">${escapeHtml(v.description).substring(0, 150)}${v.description.length > 150 ? '...' : ''}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (result.message) {
                container.innerHTML = `
                    <div class="vacancies-empty">
                        <p>ℹ️ ${result.message}</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="vacancies-empty">
                        <p>😔 ${t['no-vacancies'] || 'Geen passende vacatures gevonden op dit moment.'}</p>
                        <p>${t['check-later'] || 'Kom later terug, er worden regelmatig nieuwe vacatures toegevoegd!'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error finding vacancies:', error);
            container.innerHTML = `
                <div class="vacancies-error">
                    <p>❌ ${t['error-vacancies'] || 'Fout bij ophalen vacatures. Probeer het later opnieuw.'}</p>
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.textContent = '🔍 ' + (t['find-vacancies'] || 'Zoek Vacatures');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showErrorMessage(message) {
        if (currentQuestion < 0 || currentQuestion >= questions.length) return;
        const currentQuestionElement = questions[currentQuestion];
        if (!currentQuestionElement) return;
        const t = translations[currentLanguage];
        currentQuestionElement.innerHTML = `
            <div class="question">
                <h2 data-text="error-title">${t['error-title']}</h2>
                <p style="color: #e53e3e; margin-bottom: 20px;">${message}</p>
                <button type="button" id="retryBtn" class="generate-btn" data-text="error-button">${t['error-button']}</button>
            </div>
        `;

        // Add click handler for retry
        document.getElementById('retryBtn').addEventListener('click', function() {
            // Reload the page to start fresh
            window.location.reload();
        });
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
        
        // Update active language button
        updateActiveLanguageButton();

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
            if (currentQuestion >= 0 && currentQuestion < questions.length) {
                const currentQuestionElement = questions[currentQuestion];
                if (currentQuestionElement && currentQuestionElement.contains(this)) {
                    updateNextButton();
                }
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

    // CV Upload functionality
    const uploadBox = document.getElementById('uploadBox');
    const cvFileInput = document.getElementById('cvFileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadStatusText = document.getElementById('uploadStatusText');

    if (uploadBox && cvFileInput) {
        // Click to upload
        uploadBox.addEventListener('click', () => {
            cvFileInput.click();
        });

        // Drag and drop
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('drag-over');
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('drag-over');
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleCVUpload(files[0]);
            }
        });

        // File input change
        cvFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleCVUpload(e.target.files[0]);
            }
        });
    }

    async function handleCVUpload(file) {
        const t = translations[currentLanguage];

        // Validate file type
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const validExtensions = ['.pdf', '.docx'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            // Show error in UI instead of alert
            uploadBox.style.display = 'none';
            uploadStatus.style.display = 'block';
            uploadStatus.classList.add('upload-error');
            uploadStatusText.innerHTML = `
                <span style="color: #e53e3e; font-size: 1.5rem;">❌</span><br>
                ${t['upload-error-format'] || 'Please upload a PDF or Word document (.docx)'}<br>
                <small style="color: #718096;">${t['upload-formats'] || 'Supported: PDF, Word (.docx)'}</small>
            `;
            // Reset after 3 seconds so user can try again
            setTimeout(() => {
                uploadStatus.style.display = 'none';
                uploadStatus.classList.remove('upload-error');
                uploadBox.style.display = 'flex';
            }, 3000);
            return;
        }

        // Show loading state
        uploadBox.style.display = 'none';
        uploadStatus.style.display = 'block';
        uploadStatusText.textContent = t['parsing-cv'] || 'Analyzing your CV with AI...';

        try {
            // Convert file to base64
            const base64Data = await fileToBase64(file);

            // Send to server for parsing
            const response = await fetch('/api/parse-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileData: base64Data,
                    fileType: file.type,
                    fileName: file.name,
                    language: currentLanguage
                })
            });

            const result = await response.json();

            if (result.success && result.data) {
                // Show success state
                uploadStatus.classList.add('upload-success');
                uploadStatusText.textContent = t['cv-parsed-success'] || 'CV successfully analyzed! Filling in the form...';

                // Track CV upload
                if (window.jpTrack) {
                    window.jpTrack('cv_upload', { fileType: file.type });
                }

                // Auto-fill form fields
                setTimeout(() => {
                    fillFormWithParsedData(result.data);
                }, 1000);
            } else {
                throw new Error(result.message || 'Failed to parse CV');
            }

        } catch (error) {
            console.error('CV upload error:', error);
            uploadStatus.classList.add('upload-error');
            uploadStatusText.textContent = error.message || (t['cv-parse-error'] || 'Error analyzing CV. Please try again or fill in manually.');

            // Reset after 3 seconds
            setTimeout(() => {
                uploadStatus.style.display = 'none';
                uploadStatus.classList.remove('upload-error');
                uploadBox.style.display = 'block';
            }, 3000);
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    function fillFormWithParsedData(data) {
        const t = translations[currentLanguage];

        // Map parsed data to form fields
        const fieldMapping = {
            fullName: 'fullName',
            email: 'email',
            phone: 'phone',
            location: 'location',
            birthDate: 'birthDate',
            languages: 'languages',
            jobTitle: 'jobTitle',
            summary: 'summary',
            experience: 'experience',
            education: 'education',
            skills: 'skills',
            achievements: 'achievements'
        };

        // Fill each field
        Object.entries(fieldMapping).forEach(([dataKey, fieldName]) => {
            if (data[dataKey]) {
                const input = document.querySelector(`[name="${fieldName}"]`);
                if (input) {
                    input.value = data[dataKey];
                    formData[fieldName] = data[dataKey];
                    input.setAttribute('data-has-been-touched', 'true');
                }
            }
        });

        // Update status message
        uploadStatusText.textContent = t['cv-filled-success'] || 'Form filled! Review and continue.';

        // After a moment, navigate to the questionnaire to review
        setTimeout(() => {
            // Hide upload screen
            const uploadScreen = document.getElementById('uploadScreen');
            if (uploadScreen) {
                uploadScreen.classList.remove('active');
            }

            // Navigate to first question to review/edit
            currentQuestion = 0;
            showQuestion(0);
            updateProgress();
            updateNavigation();
            updateNextButton();
        }, 1500);
    }
});