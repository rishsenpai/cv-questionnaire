document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('questionnaire');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const progress = document.getElementById('progress');
    const generateBtn = document.getElementById('generateCV');
    const modal = document.getElementById('cvModal');
    const closeModal = document.querySelector('.close');
    const downloadBtn = document.getElementById('downloadCV');
    
    let currentQuestion = 0;
    const totalQuestions = 11; // 0-10
    const formData = {};
    
    const questions = document.querySelectorAll('.question-container');
    
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
        
        const cvHTML = `
            <div class="cv-header">
                <div class="cv-name">${formData.fullName || 'Your Name'}</div>
                <div class="cv-title">${formData.jobTitle || 'Professional Title'}</div>
                <div class="cv-contact">
                    ${formData.email || 'email@example.com'} • 
                    ${formData.phone || 'Phone Number'} • 
                    ${formData.location || 'Location'}
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
        `;
        
        cvPreview.innerHTML = cvHTML;
    }
    
    async function submitCV() {
        try {
            // Show loading state
            generateBtn.textContent = 'Submitting...';
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
            generateBtn.textContent = 'Submit CV';
            generateBtn.disabled = false;
        }
    }
    
    function showSuccessMessage() {
        const currentQuestionElement = questions[currentQuestion];
        currentQuestionElement.innerHTML = `
            <div class="question completed">
                <h2>✅ CV Submitted Successfully!</h2>
                <p>Thank you for submitting your CV. It has been sent and you'll hear back soon.</p>
                <button type="button" onclick="window.location.reload()" class="generate-btn">Submit Another CV</button>
            </div>
        `;
    }
    
    function showErrorMessage(message) {
        const currentQuestionElement = questions[currentQuestion];
        currentQuestionElement.innerHTML = `
            <div class="question">
                <h2>❌ Submission Failed</h2>
                <p style="color: #e53e3e; margin-bottom: 20px;">${message}</p>
                <button type="button" onclick="generateBtn.click()" class="generate-btn">Try Again</button>
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
                        font-family: 'Times New Roman', serif;
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
                        font-size: 16px;
                        color: #667eea;
                        margin-bottom: 15px;
                        font-style: italic;
                    }
                    .cv-contact {
                        font-size: 12px;
                        color: #4a5568;
                    }
                    .cv-section {
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                    }
                    .cv-section-title {
                        font-size: 16px;
                        font-weight: bold;
                        color: #2d3748;
                        margin-bottom: 10px;
                        padding-bottom: 5px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .cv-content {
                        font-size: 12px;
                        white-space: pre-line;
                    }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .cv-header { margin-bottom: 20px; padding-bottom: 15px; }
                        .cv-section { margin-bottom: 15px; }
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