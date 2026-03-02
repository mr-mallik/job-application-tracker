# Job Application Tracker

A Next.js 14 application for tracking job applications with AI-powered document generation. Features intelligent web scraping, automated resume and cover letter generation, and comprehensive application management.

## Features

- 🤖 **AI-Powered**: Gemini AI integration for document generation and job data classification
- 🔍 **Smart Scraping**: Playwright-based web scraping for LinkedIn, Indeed, and other job boards
- 📄 **Document Generation**: Automated, ATS-friendly resume and cover letter creation
- 📊 **Application Tracking**: Manage job applications through multiple pipeline stages
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 🔐 **Secure Authentication**: JWT-based auth with email verification

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, MongoDB
- **AI**: Google Gemini API
- **Web Scraping**: Playwright, Cheerio
- **PDF Generation**: @react-pdf/renderer

---

## Setup

### Prerequisites

- **Node.js**: v18+ recommended
- **MongoDB**: Local instance or MongoDB Atlas connection
- **npm**: Package manager (comes with Node.js)
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd job-application-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Playwright browsers** (required for web scraping)

   ```bash
   npx playwright install chromium
   ```

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Database
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=job_tracker

   # AI Service
   GEMINI_API_KEY=your_gemini_api_key_here

   # Authentication
   JWT_SECRET=your_secure_random_string_here

   # API Configuration
   CORS_ORIGINS=*

   # Optional: Email Service (SMTP)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=465
   SMTP_USERNAME=notifications@example.com
   SMTP_PASSWORD=your_smtp_password
   SMTP_ENCRYPTION=ssl
   ```

   **Note**: If SMTP is not configured, email verification logs will output to console.

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

### Alternative Development Modes

If you encounter hot reload issues:

```bash
npm run dev:webpack    # Alternative HMR configuration
npm run dev:no-reload  # Disable hot reloading
```

### Production Build

```bash
npm run build
npm start
```

The build creates a standalone output optimized for deployment.

---

## Code Formatting

This project uses **Prettier** for consistent code formatting.

### Configuration

Prettier settings ([.prettierrc.json](.prettierrc.json)):

- **Semicolons**: Required
- **Quotes**: Single quotes
- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Trailing Commas**: ES5 compatible
- **Arrow Parens**: Always
- **Line Endings**: LF (Unix-style)

### Commands

```bash
# Format all files
npm run format

# Check formatting without modifying files
npm run format:check
```

### Editor Integration

**VS Code**: Install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

---

## Linting

This project uses **ESLint** with Next.js and Prettier integration.

### Configuration

ESLint rules ([.eslintrc.json](.eslintrc.json)):

- Extends `next/core-web-vitals` and `prettier`
- React import in JSX scope: Off (Next.js 13+ automatic)
- PropTypes validation: Off (using TypeScript patterns)
- Unused variables: Warning (ignores variables prefixed with `_`)
- Console statements: Allowed

### Commands

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Pre-commit Hooks

**lint-staged** automatically runs on staged files before commit:

- JavaScript/JSX/TypeScript files: ESLint + Prettier
- JSON/Markdown/CSS files: Prettier only

To bypass hooks (not recommended):

```bash
git commit --no-verify
```

---

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/[[...path]]/   # Monolithic API catch-all route
│   ├── profile/           # User profile management pages
│   ├── templates/         # Document templates
│   └── legal/            # Terms, Privacy, Cookies pages
├── components/            # React components
│   ├── ui/               # shadcn/ui component library
│   └── pdf-templates/    # PDF document templates
├── lib/                   # Backend utilities
│   ├── gemini.js         # AI integration
│   ├── scraper.js        # Web scraping logic
│   ├── auth.js           # JWT authentication
│   └── db.js             # MongoDB connection
├── hooks/                 # Custom React hooks
└── public/               # Static assets
```

### Important Architectural Notes

- **Monolithic API**: All backend routes handled in [app/api/[[...path]]/route.js](app/api/[[...path]]/route.js)
- **Client-Side Only**: App uses `'use client'` directive (no Server Components)
- **AI Integration**: Always use `generateWithFallback()` for Gemini calls (implements model rotation)

---

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START -->

Thanks to these wonderful people who have contributed to this project:

<table>
<tr>
  <td align="center">
    <a href="mailto:github@emergent.sh">
      <img src="https://www.gravatar.com/avatar/25a10b774028c6513970ce6e5ddd2573?s=100&d=identicon" width="80px;" alt="emergent-agent-e1"/><br />
      <sub><b>emergent-agent-e1</b></sub>
    </a><br />
    <sub>78 commits</sub>
  </td>
  <td align="center">
    <a href="mailto:76590368+mr-mallik@users.noreply.github.com">
      <img src="https://www.gravatar.com/avatar/da0274f2dda891178183e6b4f1b08462?s=100&d=identicon" width="80px;" alt="Gulger Mallik"/><br />
      <sub><b>Gulger Mallik</b></sub>
    </a><br />
    <sub>59 commits</sub>
  </td>
</tr>
</table>
<!-- ALL-CONTRIBUTORS-LIST:END -->

### Updating Contributors

To refresh the contributors list based on the latest git commits:

```bash
npm run contributors
```

This automatically updates the Contributors section above with avatars, names, and commit counts.

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following conventional commits
4. Run `npm run lint:fix` and `npm run format` before committing
5. Push to your branch and open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For issues or questions, please open an issue in the repository issue tracker.
