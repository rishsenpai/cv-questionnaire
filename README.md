# CV Questionnaire

A typeform-style questionnaire that collects CV information and emails it to you.

## 🌐 Live Demo
**Production URL:** https://cv-questionnaire.vercel.app

> Note: The GitHub Pages URL (rishsenpai.github.io/cv-questionnaire/) is for static preview only and does not support CV submission. Use the Vercel URL above for full functionality.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email Settings
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file with your email settings:
   ```
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASS=your_app_password
   RECIPIENT_EMAIL=where_you_want_cvs_sent@gmail.com
   PORT=3000
   ```

### 3. Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### 4. Run the Application
```bash
npm start
```

Visit: `http://localhost:3000`

## How It Works

1. Users fill out the typeform-style questionnaire
2. On completion, their CV data is submitted to your server
3. Server formats the CV as HTML and emails it to you
4. You receive a nicely formatted CV email with applicant details

## Deployment

This project is configured for **Vercel** deployment (recommended).

### Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Import the `cv-questionnaire` repository
3. Configure Environment Variables:
   - `EMAIL_USER` - Your Gmail address
   - `EMAIL_PASS` - Your Gmail app password
   - `RECIPIENT_EMAIL` - Where to receive CVs
4. Click Deploy

Vercel will automatically redeploy when you push to GitHub.

### Why Not GitHub Pages?
GitHub Pages only supports static files and cannot run the Node.js backend needed for email functionality. Use Vercel instead for full functionality.

## Sharing with Users

Once deployed, share your app URL with potential applicants. They'll fill out the questionnaire and you'll receive their CV via email.

## Customization

- **Questions**: Edit `index.html` to modify questionnaire questions
- **Styling**: Update `styles.css` for visual changes  
- **Email Template**: Modify `generateCVHTML()` in `server.js`
- **Validation**: Add custom validation in `script.js`

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords, not your main email password
- Consider adding rate limiting for production use
- Validate and sanitize user inputs before processing