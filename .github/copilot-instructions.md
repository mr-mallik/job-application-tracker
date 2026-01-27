# Job Application Tracker - AI Agent Instructions

## Project Overview
A Next.js 14 (App Router) application for tracking job applications with AI-powered document generation. Uses MongoDB for data persistence, Google Gemini AI for content generation, and Playwright for web scraping.

## Architecture

### Monolithic API Design
All backend routes are handled through a **single catch-all route**: [app/api/[[...path]]/route.js](app/api/[[...path]]/route.js). Routes are matched by path string comparison within this file (e.g., `/auth/login`, `/jobs/scrape`, `/documents/refine`). This is NOT Next.js conventions—do not create separate route files.

### Data Flow: Web Scraping + AI Classification
Job scraping follows a 3-step pipeline:
1. **Playwright** ([lib/scraper.js](lib/scraper.js)): Fetches dynamic content, expands "Show more" buttons, waits for JS rendering
2. **Cheerio**: Parses HTML extracting `possibleTitles`, `possibleCompanies`, etc. based on job board selectors (LinkedIn, Indeed, etc.)
3. **Gemini AI** ([lib/gemini.js](lib/gemini.js)): `classifyJobData()` receives scraped data + URL, returns structured job object

### AI Integration Pattern
- `lib/gemini.js` implements model fallback: tries `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-001` with retries
- `refineDocument()` generates resumes/cover letters with **strict rules**: never fabricate data, only use provided content
- Resume generation requires user profile structure with specific markdown format (see lines 180-230 in [lib/gemini.js](lib/gemini.js))

### Frontend Architecture
- **Single-page application**: All UI is in [app/page.js](app/page.js) (1100+ lines)
- Client-side only (`'use client'`), no Server Components
- Uses shadcn/ui components extensively from `@/components/ui/*`
- Custom PDF preview components render A4-sized documents for resume/cover letter preview

## Key Conventions

### Environment Variables
Required in `.env.local` (not committed):
```
MONGO_URL=mongodb://...
GEMINI_API_KEY=...
JWT_SECRET=...
CORS_ORIGINS=*
DB_NAME=job_tracker
```

### Authentication
- JWT tokens with 7-day expiry ([lib/auth.js](lib/auth.js))
- All protected routes check `Authorization: Bearer <token>` header
- Email verification uses console-logged codes (no email service configured)
- Password reset codes also logged to console

### Database Schema
MongoDB collections (no schema enforcement):
- `users`: `{id, email, password, name, isVerified, verificationCode, profile{...}}`
- `jobs`: `{id, userId, title, company, status, resume{content, refinedContent}, coverLetter{...}, supportingStatement{...}}`

Job status enum: `saved`, `applied`, `interview`, `offer`, `rejected`, `withdrawn`

### Import Aliases
- `@/components/ui/*` → shadcn/ui components
- `@/lib/*` → backend utilities
- `@/hooks/*` → React hooks
- Configured in [jsconfig.json](jsconfig.json)

## Development Workflows

### Running the Application
```bash
npm run dev              # Standard dev server (limited memory)
npm run dev:webpack      # Alternative if HMR issues occur
npm run build            # Production build (standalone output)
```

Development server runs on port 3000 with `0.0.0.0` binding for container compatibility.

### Testing
Python tests verify backend functionality:
- [test_ai_endpoints.py](test_ai_endpoints.py): Tests document refinement and Gemini integration
- [test_gemini.py](test_gemini.py): Direct Gemini API validation
- [backend_test.py](backend_test.py): API endpoint testing with existing user credentials

No frontend tests configured. Use `python test_*.py` to run.

### Hot Reload Configuration
Next.js is configured with reduced resources ([next.config.js](next.config.js)):
- Poll-based file watching (2s interval)
- Max 2 pages buffered in dev mode
- 512MB Node memory limit via `NODE_OPTIONS`
- Optimized for cloud IDE environments

## Critical Patterns

### API Response Format
All API responses use CORS wrapper:
```javascript
return handleCORS(NextResponse.json({ ... }))
```

### Error Handling in Gemini Calls
Never throw on first failure. The `generateWithFallback()` function implements model rotation and rate limit handling (2s delay on 503/429 errors).

### Document Generation Rules
When modifying `refineDocument()`:
- **NEVER** generate fake experience or achievements
- Only restructure/rephrase existing user content
- Resume must fit 2 A4 pages (enforced in frontend preview)
- Use action verbs and ATS-friendly formatting
- Extract job description keywords for tailoring

### Job Board Scraping
`detectJobBoard(url)` identifies platforms. Add new selectors to `parseWithCheerio()` for additional job boards. Always test with real URLs—selectors frequently change.

## Common Tasks

**Add new API endpoint**: Edit [app/api/[[...path]]/route.js](app/api/[[...path]]/route.js), add route match in `handleRoute()` function

**Add new shadcn component**: Use `npx shadcn@latest add <component>` (configured via [components.json](components.json))

**Modify job scraping logic**: Update [lib/scraper.js](lib/scraper.js) for extraction, [lib/gemini.js](lib/gemini.js) for classification prompt

**Change database schema**: Update object structure in route handlers—no migrations needed (schema-less MongoDB)

**Debug Gemini failures**: Check console logs for model rotation attempts, ensure `GEMINI_API_KEY` is set, verify against [list_gemini_models.py](list_gemini_models.py)

## Known Constraints
- No email service (verification codes logged to console)
- Playwright requires system dependencies (fails without browser binaries)
- Gemini API rate limits require fallback logic
- Frontend is not mobile-optimized (desktop-first design)
- No database migrations or seeding—create test data via API

## Project-Specific Anti-Patterns
❌ Do NOT create separate route files in `app/api/`—everything goes in the catch-all route
❌ Do NOT use Server Components—this app is fully client-side
❌ Do NOT call Gemini directly without `generateWithFallback()`—always use retry logic
❌ Do NOT add fabricated user data to AI-generated documents—strict content fidelity
