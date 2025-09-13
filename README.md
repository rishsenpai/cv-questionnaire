# CV Questionnaire - Setup Instructions

A typeform-style questionnaire that collects CV information and emails it to you.

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

## Deployment Options

### Option 1: Heroku (Free Tier Available)
1. Install Heroku CLI
2. Create new Heroku app:
   ```bash
   heroku create your-cv-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set EMAIL_USER=your.email@gmail.com
   heroku config:set EMAIL_PASS=your_app_password
   heroku config:set RECIPIENT_EMAIL=your.email@gmail.com
   ```
4. Deploy:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` and follow prompts
3. Set environment variables in Vercel dashboard

### Option 3: Railway
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

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