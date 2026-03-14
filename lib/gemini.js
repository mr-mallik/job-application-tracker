import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  BLOCK_TYPES,
  createBlock,
  createSectionTitleBlock,
  createSubheadingBlock,
  createTextBlock,
  createSkillGroupBlock,
  createClSalutationBlock,
  createClClosingBlock,
} from '@/lib/blockSchema';
import { slateFromText, slateFromLines } from '@/lib/slateUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001'];

export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  return genAI.getGenerativeModel({ model: modelName });
}

// Try multiple models with fallback
async function generateWithFallback(prompt) {
  const models = geminiModels;
  let lastError = null;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error(`${modelName} attempt ${attempt} failed:`, error.message);
        lastError = error;

        const errorMsg = error.message || String(error);
        if (
          errorMsg.includes('overloaded') ||
          errorMsg.includes('503') ||
          errorMsg.includes('429')
        ) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else if (!errorMsg.includes('404')) {
          // For non-404 errors that aren't rate limits, try next model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All models failed');
}

// Classify scraped data into structured job fields using Gemini AI
export async function classifyJobData(scrapedData, url) {
  const prompt = `
You are a job data extraction specialist. Analyze the following scraped data from a job posting page and classify it into the correct fields.

URL: ${url}

Scraped Data:
- Possible Titles: ${JSON.stringify(scrapedData.possibleTitles.slice(0, 10))}
- Possible Companies: ${JSON.stringify(scrapedData.possibleCompanies.slice(0, 10))}
- Possible Locations: ${JSON.stringify(scrapedData.possibleLocations.slice(0, 10))}
- Possible Salaries: ${JSON.stringify(scrapedData.possibleSalaries.slice(0, 10))}
- Possible Dates: ${JSON.stringify(scrapedData.possibleDates.slice(0, 10))}
- Possible Descriptions: ${JSON.stringify(scrapedData.possibleDescriptions.slice(0, 3).map((d) => d.substring(0, 2000)))}

Raw Page Text (excerpt):
${scrapedData.rawText?.substring(0, 8000) || scrapedData.visibleText?.substring(0, 8000) || ''}

Instructions:
1. Select the MOST LIKELY correct value for each field from the scraped data
2. For job description, extract the main job duties, responsibilities, and about the role
3. For requirements, extract qualifications, skills, experience needed
4. For salary, format it nicely (e.g., "£50,000 - £70,000 per annum")
5. For closing date, extract any application deadline mentioned
6. If a field cannot be determined, use null

Return a valid JSON object with ONLY these fields:
{
  "title": "Job title string",
  "company": "Company/Organization name",
  "location": "Job location",
  "salary": "Salary information or null",
  "closingDate": "Application deadline date or null",
  "description": "Full job description including duties and responsibilities",
  "requirements": "Required qualifications, skills, and experience",
  "benefits": "Benefits mentioned or null"
}

Return ONLY the JSON object, no markdown formatting or explanation.
`;

  try {
    let text = await generateWithFallback(prompt);

    // Clean up response - remove markdown code blocks if present
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();

    const parsed = JSON.parse(text);

    // Validate and clean the response
    return {
      title: parsed.title || null,
      company: parsed.company || null,
      location: parsed.location || null,
      salary: parsed.salary || null,
      closingDate: parsed.closingDate || null,
      description: parsed.description || null,
      requirements: parsed.requirements || null,
      benefits: parsed.benefits || null,
    };
  } catch (error) {
    console.error('Gemini classification error:', error);
    throw new Error('Failed to classify job data - AI service unavailable');
  }
}

// Legacy function - extract job details from raw HTML content
export async function extractJobDetailsFromHTML(url, htmlContent) {
  const model = getGeminiModel();

  const prompt = `
Analyze this job listing webpage content and extract job details.
URL: ${url}

Extract and return a JSON object with these fields (use null if not found):
{
  "title": "Job title",
  "company": "Company/Organisation name",
  "location": "Job location",
  "salary": "Salary information",
  "closingDate": "Application deadline/closing date",
  "description": "Full job description text",
  "requirements": "Key requirements and qualifications",
  "benefits": "Benefits if mentioned"
}

Webpage content:
${htmlContent.substring(0, 50000)}

Return ONLY valid JSON, no markdown or explanations.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up the response
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }

    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Gemini extraction error:', error);
    throw new Error('Failed to extract job details');
  }
}

// Extract job details from pasted text using Gemini AI
export async function extractJobDetailsFromText(text) {
  const prompt = `
You are a job data extraction specialist. Analyze the following job posting text and extract structured information.

Job Posting Text:
${text.substring(0, 20000)}

Instructions:
1. Identify the job title, company name, and location
2. Extract salary information if mentioned
3. Find any application deadline or closing date
4. Separate the main job description (duties, responsibilities, about the role)
5. Extract requirements (qualifications, skills, experience needed)
6. Find benefits or perks mentioned
7. If information is not present in the text, use null

Return a valid JSON object with ONLY these fields:
{
  "title": "Job title string",
  "company": "Company/Organization name",
  "location": "Job location",
  "salary": "Salary information or null",
  "closingDate": "Application deadline date or null",
  "description": "Full job description including duties and responsibilities",
  "requirements": "Required qualifications, skills, and experience",
  "benefits": "Benefits mentioned or null"
}

Return ONLY the JSON object, no markdown formatting or explanation.
`;

  try {
    let responseText = await generateWithFallback(prompt);

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    const parsed = JSON.parse(responseText);

    // Validate and clean the response
    return {
      title: parsed.title || null,
      company: parsed.company || null,
      location: parsed.location || null,
      salary: parsed.salary || null,
      closingDate: parsed.closingDate || null,
      description: parsed.description || null,
      requirements: parsed.requirements || null,
      benefits: parsed.benefits || null,
    };
  } catch (error) {
    console.error('Gemini text extraction error:', error);
    throw new Error('Failed to extract job details from text - AI service unavailable');
  }
}

// Parse resume PDF to extract structured profile data
export async function parseResumePDF(base64Content) {
  const prompt = `
You are a resume parsing expert. Extract structured information from this resume PDF and return it as a JSON object.

IMPORTANT: Return ONLY a valid JSON object with NO markdown formatting, NO code blocks, NO explanations.

Extract and structure the following information:
{
  "name": "Full name",
  "designation": "Current job title or professional designation",
  "email": "Email address",
  "phone": "Phone number",
  "linkedin": "LinkedIn URL",
  "portfolio": "Portfolio/website URL",
  "summary": "Professional summary or objective (2-3 sentences)",
  "experiences": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Location",
      "startDate": "MMM/yyyy",
      "endDate": "MMM/yyyy or Present",
      "description": "Bullet points of achievements and responsibilities (one per line)"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "fieldOfStudy": "Field of study if mentioned",
      "institution": "Institution name",
      "location": "Location",
      "grade": "Grade/GPA if mentioned",
      "startDate": "MMM/yyyy",
      "endDate": "MMM/yyyy",
      "graduationDate": "MMM/yyyy or graduation year"
    }
  ],
  "skills": {
    "relevant": "Comma-separated list of technical/professional skills",
    "other": "Comma-separated list of soft skills"
  },
  "projects": [
    {
      "title": "Project name",
      "url": "Project URL if available",
      "description": "Brief description"
    }
  ],
  "interests": [
    {
      "title": "Interest title",
      "description": "Brief description"
    }
  ],
  "achievements": "Awards, certifications, accomplishments (one per line)"
}

RULES:
1. Extract dates in MMM/yyyy format using 3-letter month abbreviations (e.g., "Sep/2024", "Jan/2023", "Dec/2022")
2. Use "Present" for current positions (case-sensitive)
3. For education, use both startDate and endDate in MMM/yyyy format, plus graduationDate
4. If information is not found, use empty string "" or empty array []
5. For experiences, extract ALL work history entries in reverse chronological order
6. For education, extract ALL education entries as an array (degrees, diplomas, certifications)
7. Preserve bullet points in descriptions but format as plain text with line breaks
8. Return ONLY the JSON object, nothing else
`;

  // Use Gemini's native PDF processing with inlineData format
  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Content,
      },
    },
  ];

  const models = geminiModels;
  let lastError = null;

  for (const modelName of models) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(contents);
      const response = await result.response;
      let text = response.text();

      // Clean up response
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.slice(7);
      } else if (text.startsWith('```')) {
        text = text.slice(3);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      text = text.trim();

      const parsed = JSON.parse(text);

      // Ensure proper structure with defaults
      const education = Array.isArray(parsed.education)
        ? parsed.education
        : parsed.education
          ? [parsed.education]
          : [];

      return {
        name: parsed.name || '',
        designation: parsed.designation || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        linkedin: parsed.linkedin || '',
        portfolio: parsed.portfolio || '',
        summary: parsed.summary || '',
        experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
        education: education,
        skills: parsed.skills || { relevant: '', other: '' },
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        interests: Array.isArray(parsed.interests) ? parsed.interests : [],
        achievements: parsed.achievements || '',
      };
    } catch (error) {
      console.error(`${modelName} resume parsing failed:`, error.message);
      lastError = error;
      // Try next model
      continue;
    }
  }

  console.error('Resume parsing error:', lastError);
  throw new Error('Failed to parse resume: ' + (lastError?.message || 'All models failed'));
}

// Generate document content directly as a blocks[] array
export async function refineDocumentToBlocks(
  documentType,
  content,
  jobDescription,
  userPreferences = '',
  userProfile = null
) {
  let prompt = '';

  if (documentType === 'resume' && userProfile) {
    // Resume generation from structured profile data
    prompt = `
You are an expert UK CV writer with deep knowledge across all industries including technology, healthcare, finance, marketing, academia, public sector, legal, engineering, and C-suite executive roles.

STEP 1 — ANALYSE THE JOB:
Before writing, read the job description carefully and identify:
- INDUSTRY: (e.g., Technology, Healthcare, Marketing, Finance, Academia, Public Sector, Creative, Legal, Engineering)
- ROLE LEVEL: Determine from years of experience in the profile and seniority signals in the JD:
  • GRADUATE/FRESHER (0–2 years or student)
  • MID-LEVEL (2–8 years, individual contributor)
  • SENIOR (8–15 years, specialist or team lead)
  • DIRECTOR/EXECUTIVE (15+ years, strategic leadership, C-suite)
- ESSENTIAL CRITERIA: List any explicitly stated "essential" or "required" requirements from the JD
- DESIRABLE CRITERIA: List any explicitly stated "desirable" or "preferred" requirements
- TOP ATS KEYWORDS: Identify 10–15 key terms from the JD to weave naturally into the CV

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE DATA:
${content}

${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}` : ''}

STEP 2 — GENERATE THE CV:

SECTION ORDERING — choose the correct order based on ROLE LEVEL detected:

GRADUATE/FRESHER (0–2 years):
PROFESSIONAL PROFILE → EDUCATION → SKILLS → PROJECTS → WORK EXPERIENCE → CERTIFICATIONS → INTERESTS

MID-LEVEL (2–8 years):
PROFESSIONAL PROFILE → WORK EXPERIENCE → EDUCATION → SKILLS → CERTIFICATIONS → PROJECTS → INTERESTS

SENIOR (8–15 years):
PROFESSIONAL PROFILE → WORK EXPERIENCE → KEY ACHIEVEMENTS → EDUCATION → SKILLS → CERTIFICATIONS

DIRECTOR/EXECUTIVE (15+ years):
PROFESSIONAL PROFILE → WORK EXPERIENCE → KEY ACHIEVEMENTS → EDUCATION → PROFESSIONAL MEMBERSHIPS → CERTIFICATIONS

ACADEMIC ROLES (any level):
PROFESSIONAL PROFILE → EDUCATION → RESEARCH EXPERIENCE → TEACHING EXPERIENCE → PUBLICATIONS/PROJECTS → SKILLS → PROFESSIONAL MEMBERSHIPS

HEALTHCARE/REGULATED ROLES:
PROFESSIONAL PROFILE → PROFESSIONAL REGISTRATION & MEMBERSHIPS → WORK EXPERIENCE → EDUCATION → SKILLS → CPD

---

# PROFESSIONAL PROFILE
2–3 sentences only. Tailor to this specific role. State years of experience (if 2+), core area of expertise, and most relevant value proposition. Use 2–3 keywords from the JD. Do NOT start with "I". Do NOT use clichés ("passionate", "results-driven", "dynamic"). Adapt tone to industry:
  • Technology: precise, competency-led
  • Healthcare: patient-centred, values-led
  • Marketing: outcome-driven, brand-aware
  • Academia: research-focused, scholarly
  • Executive: strategic, commercially aware
  • Creative: distinctive, portfolio-led

# WORK EXPERIENCE
Reverse chronological (most recent first). For each role:
**[Job Title] | [Company Name], [Location] | [Month Year] – [Month Year or Present]**
- Start EVERY bullet with a strong action verb (Led, Delivered, Developed, Managed, Implemented, Secured, Reduced, Grew, Launched, Designed, Coordinated, etc.)
- Prioritise bullets that directly evidence ESSENTIAL CRITERIA from the JD — place these first
- Include metrics and outcomes where present in the profile data — do NOT invent figures
- Remove irrelevant bullets when space is tight; retain the 3–4 most relevant per role
- For healthcare roles: reference patient care, clinical governance, MDT working, regulatory compliance
- For academic roles: reference research output, teaching delivery, supervision, grant contributions
- For executive roles: reference P&L, strategic direction, organisational transformation, board engagement

# EDUCATION
Reverse chronological (most recent first). For each qualification:
**[Degree/Qualification Name] | [Grade — e.g., First Class, 2:1, Distinction, Merit, Pass] | [Year – Year]**
[Institution Name], [Location]
[Optional: dissertation title or highly relevant modules only if directly related to the JD]

# SKILLS (adapt structure to industry)
For TECHNICAL roles: Group by category — Programming Languages | Frameworks & Libraries | Cloud & DevOps | Databases | Tools
For PROFESSIONAL/BUSINESS roles: Two groups — Relevant Skills | Additional Skills
For HEALTHCARE: Three groups — Clinical Skills | Technical & IT | Soft Skills
For CREATIVE: Relevant Software & Tools | Creative Disciplines | Soft Skills
Only list skills evidenced in the experience data or directly matching JD keywords.

# CERTIFICATIONS & PROFESSIONAL DEVELOPMENT (include if relevant to role)
**[Certification Name]** | [Issuing Body] | [Month Year]
Examples: AWS Certified, PRINCE2, NMC Pin, CIM, CIPD, ACA/ACCA, PMP, CIMA, SIA Licence, etc.

# KEY ACHIEVEMENTS (include for SENIOR/EXECUTIVE only)
- 3–5 high-impact accomplishments with context and outcome
- Quantify where data exists in the profile
- Prioritise achievements that address ESSENTIAL CRITERIA

# PROJECTS (include for GRADUATE/FRESHER or TECHNICAL/CREATIVE roles)
**[Project Title]** | [URL if available] | [Month Year – Month Year]
[2–3 lines: technologies or methodologies used, problem addressed, outcome achieved]

# PROFESSIONAL MEMBERSHIPS (include for regulated, academic, or senior roles)
- [Membership Name] | [Professional Body] | [Status: Member / Fellow / Associate / Chartered]

# INTERESTS (optional — include only if directly relevant to the role or it adds meaningful professional context)
1–2 lines maximum. Skip entirely if space is tight.

---

PAGE LIMIT — STRICTLY 2 A4 PAGES:
If the content would exceed 2 pages, apply these cuts in priority order:
1. Remove or condense roles older than 10 years to a single line each (no bullets)
2. Remove the INTERESTS section
3. Reduce bullets per role to the 3 most relevant
4. Remove less relevant module/dissertation details from EDUCATION
5. NEVER remove the most recent or current role
6. NEVER remove content evidencing ESSENTIAL CRITERIA to make space for desirable or optional content

PRIORITY RULE: Content evidencing ESSENTIAL CRITERIA must appear prominently and be retained above all else. Desirable criteria content is secondary. Generic content is cut first.

---

UK CV CONVENTIONS (MANDATORY):
- UK English spelling throughout: organised, recognised, programme, behaviour, colour, specialise, utilise, centre, analyse, defence, practise (verb), licence (noun)
- Date format: Profile dates are stored as "MMM/yyyy" (e.g., Sep/2024, Mar/2023). Convert to display format "Month Year" (e.g., Sep 2024, Mar 2023) by removing the slash
- For date ranges: "Sep 2022 – Mar 2024" or "Sep 2022 – Present"
- Use "Present" (case-sensitive) for ongoing roles
- DO NOT include: name, email, phone, address, LinkedIn URL, nationality, age, date of birth, marital status — these are added separately
- Reverse chronological order throughout all sections
- Use British spelling for company names as written in the profile

CRITICAL RULES:
1. DO NOT fabricate any experience, achievement, metric, or fact not present in the profile data
2. DO NOT add numerical figures or percentages not explicitly stated in the profile
3. Rephrase and reorder existing content to align with the JD — do not invent content
4. Weave ATS keywords naturally — do not stuff or repeat them artificially
5. Do NOT include a doc-header block — name, email, phone, and links are added separately
6. Do NOT add commentary, explanations, or notes outside the JSON array

OUTPUT FORMAT — Return ONLY a valid JSON array. No markdown, no code fences, no extra text.
Use only these block types:
  { "type": "section-title", "data": { "title": "SECTION NAME IN CAPS" } }
  { "type": "subheading",    "data": { "primary": "Job Title", "secondary": "Company Name, Location", "location": "", "dateRange": "Month YYYY – Month YYYY" } }
  { "type": "text",          "data": { "text": "Single prose paragraph" } }
  { "type": "text",          "data": { "lines": ["First bullet item", "Second bullet item", "Third bullet item"] } }
  { "type": "skill-group",   "data": { "label": "Category", "skills": ["skill1", "skill2"] } }
Rules:
- Use "text" with "text" field for prose paragraphs
- Use "text" with "lines" array for bullet lists — each item is a plain string with NO leading dash, asterisk, or bullet character
- Group related bullet points into ONE block (one "lines" array) rather than many separate blocks
- subheading.secondary combines company and location: "Acme Ltd, London, UK"
- subheading.dateRange: Convert profile dates from "Sep/2024" format to display format "Sep 2024" by removing the slash. Examples: "Sep/2022 – Mar/2024" becomes "Sep 2022 – Mar 2024", "Apr/2025 – Present" becomes "Apr 2025 – Present"
- Return only the JSON array, nothing else
`;
  } else if (documentType === 'coverLetter') {
    // Cover Letter generation
    const hasUserContent = content && content.trim().length > 0;

    prompt = `
You are an expert UK career coach with experience writing compelling cover letters across all industries and seniority levels.

STEP 1 — ANALYSE BEFORE WRITING:
Read the job description and candidate profile, then determine:
- INDUSTRY: (Technology | Healthcare | Finance | Marketing | Public Sector | Academia | Creative | Legal | Engineering | Hospitality | Retail | Other)
- ROLE LEVEL from the profile's experience history:
  • GRADUATE/FRESHER (0–2 years or student)
  • MID-LEVEL (2–8 years)
  • SENIOR (8–15 years, specialist or team lead)
  • DIRECTOR/EXECUTIVE (15+ years, strategic leadership)
- TONE: Match to industry and level:
  • Technology: confident, precise, results-focused
  • Healthcare: compassionate, patient-centred, values-driven
  • Marketing/Creative: engaging, brand-aware, results-oriented
  • Finance/Legal: formal, analytical, measured
  • Academia: scholarly, research-focused, collegial
  • Public Sector: professional, public-value oriented, collaborative
  • Executive: strategic, commercially astute, authoritative
  • Graduate: enthusiastic, potential-focused, eager to contribute
- TOP 3–4 ESSENTIAL REQUIREMENTS from the JD that must be addressed in the letter
- SALUTATION: Check the JD for a named contact. If named → use "Dear [Name]," and close "Yours sincerely,". If no name → use "Dear Hiring Manager," and close "Yours faithfully,".
- COMPANY NAME and JOB TITLE: Identify for use in the letter body

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${userProfile ? JSON.stringify(userProfile) : 'Not provided'}

${hasUserContent ? `EXISTING DRAFT (use as context only — do not copy verbatim):\n${content}\n\n` : ''}${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}\n\n` : ''}
STEP 2 — WRITE THE COVER LETTER:

FORMAT — UK business letter style. Begin directly with the salutation.

---

[Dear [Name] / Dear Hiring Manager,]

**Re: Application for [Job Title]** [— Ref: [reference number] if stated in JD]

**OPENING PARAGRAPH (3–4 sentences)**
- Open with a strong, role-specific hook — do NOT start with "I am writing to apply for..."
- Introduce yourself in relation to this specific role with your most relevant credential or career USP
- Reference something specific from the JD or organisation to show genuine research
- Seniority-adapted opening:
  • Graduate/Fresher: Lead with your strongest academic achievement or most relevant placement/project
  • Mid-level: Lead with a specific, concrete professional achievement relevant to the role
  • Senior: Lead with your area of specialist expertise and a headline achievement
  • Director/Executive: Lead with the strategic transformation or commercial impact you have delivered

**BODY PARAGRAPH 1 — Primary Evidence**
Address the most critical essential requirement from the JD with a specific example from the profile:
- Name the relevant experience, project, or achievement — be concrete
- Describe what you did (action) and the outcome
- Industry-specific guidance:
  • Technology: Reference specific technologies, systems, scale, or technical problem solved
  • Healthcare: Reference patient outcomes, care quality, MDT working, regulatory compliance (CQC, NMC, GMC, etc.)
  • Marketing: Reference campaign results, audience reach, brand outcomes, or commercial impact
  • Academia: Reference research area, methodology, published/project output, teaching contributions
  • Finance/Legal: Reference regulatory environment, analytical rigour, commercial transactions or advisory work
  • Public Sector: Reference policy development, stakeholder engagement, public value delivered
  • Executive: Reference P&L ownership, organisational transformation, strategic programmes, board-level engagement

**BODY PARAGRAPH 2 — Supporting Skills and Alignment**
Address 1–2 further essential or desirable criteria:
- Show understanding of the organisation's priorities or challenges as evident from the JD
- For regulated industries: reference relevant professional registration, qualification, or accreditation
- Bullet points are acceptable here if listing multiple competencies (max 3–4):
  - [Most relevant skill or achievement aligned to JD]
  - [Relevant qualification, tool, or methodology]
  - [Key transferable competency]

**CLOSING PARAGRAPH (2–3 sentences)**
- Restate enthusiasm with specific reference to this role or organisation — not generic
- Request an interview or next step conversation
- Close professionally

[Yours sincerely, / Yours faithfully,]

[Applicant's name — leave blank, to be added by the applicant]

---

CONTENT RULES:
1. Only use information from the candidate's profile — DO NOT fabricate experience, roles, or achievements
2. ${hasUserContent ? 'The existing draft is for context only — rewrite entirely based on the profile and JD' : 'Generate entirely from the profile and JD'}
3. UK English throughout: organised, programme, behaviour, recognised, specialise, colour, centre, analyse
4. Target length: 1 A4 page (approximately 300–400 words in the body paragraphs)
5. Do NOT reference salary expectations unless the JD explicitly requests them
6. Do NOT reference right-to-work, visa status, or nationality
7. Do NOT use hollow phrases: "I am a team player", "passionate about", "hardworking individual"
8. Use the actual company name and job title from the JD where possible
9. One consistent tone throughout — match to industry and seniority level as determined in Step 1

OUTPUT FORMAT — Return ONLY a valid JSON array. No markdown, no code fences, no extra text.
Use only these block types:
  { "type": "cl-salutation", "data": { "text": "Dear [Name / Hiring Manager]," } }
  { "type": "text",          "data": { "text": "Prose paragraph content" } }
  { "type": "text",          "data": { "lines": ["First bullet item", "Second bullet item"] } }
  { "type": "cl-closing",    "data": { "text": "Yours sincerely,", "name": "" } }
Rules:
- The array MUST begin with a cl-salutation block
- The array MUST end with a cl-closing block ("Yours sincerely," or "Yours faithfully," as appropriate)
- Do NOT include a cl-header block — sender contact details are added separately
- Use "text" with "text" field for prose paragraphs; use "text" with "lines" array for bullet lists
- Each bullet item in "lines" is plain text with NO leading dash, asterisk, or bullet character
- Each prose paragraph is a separate text block
- Return only the JSON array, nothing else
`;
  } else if (documentType === 'supportingStatement') {
    // Supporting Statement generation
    const hasUserContent = content && content.trim().length > 0;

    prompt = `
You are an expert UK careers advisor specialising in criteria-driven and competency-based supporting statements across all sectors and seniority levels.

STEP 1 — PARSE THE JOB DESCRIPTION:
Carefully read the full job description and:

1. DETECT WRITING MODE:
   - CRITERIA MODE: Use this if the JD contains an explicit list of "Essential" criteria, "Desirable" criteria, or a numbered/lettered person specification (e.g., "E1. Experience of...", "D1. Knowledge of...", or a table of requirements marked Essential/Desirable)
   - COMPETENCY MODE: Use this if there is no explicit criteria list — infer 5–7 key themes from the JD instead

2. DETECT:
   - INDUSTRY: (Technology | Healthcare | Finance | Marketing | Public Sector | Academia | Creative | Legal | Engineering | Other)
   - ROLE LEVEL from the profile's experience:
     • GRADUATE/FRESHER | MID-LEVEL | SENIOR | DIRECTOR/EXECUTIVE

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${userProfile ? JSON.stringify(userProfile) : 'Not provided'}

${hasUserContent ? `EXISTING DRAFT (use as context only — do not copy verbatim):\n${content}\n\n` : ''}${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}\n\n` : ''}
STEP 2 — WRITE THE SUPPORTING STATEMENT:

=====================================
IF CRITERIA MODE (explicit Essential/Desirable list found in JD):
=====================================

Address ALL Essential criteria first, then Desirable criteria.
Use the exact wording from the JD as each section heading.

**[Exact criterion wording from JD — e.g., "Experience of managing multi-disciplinary teams"]** *(Essential)*

Provide targeted, evidence-based response:
- Lead with your most recent or strongest relevant example from the profile
- For strong evidence: use structured STAR narrative (2–4 sentences):
  Describe the Situation briefly, the Task or challenge, the specific Actions you took (use action verbs), and the Result or outcome
- For partial evidence: draw clearly on transferable experience, projects, or education
- For desirable criteria: keep to 2–3 focused sentences unless strong evidence warrants more
- Use **bold** to highlight key skills or achievements within the text
- Do NOT use the same example for two different criteria — vary your evidence pool

**[Next criterion from JD]** *(Essential / Desirable)*
[Evidence...]

Continue until all criteria have been addressed.

---

**Summary**
2–3 sentence conclusion: restate your strongest alignment to the role and express genuine enthusiasm for joining the organisation.

=====================================
IF COMPETENCY MODE (no explicit criteria list):
=====================================

**Introduction** (1 short paragraph)
Briefly introduce yourself in relation to the role. Reference the specific organisation and job title. State your core relevant background. Do NOT start with "I am writing to apply..."

**[Theme 1 — derived from JD, e.g., "Technical Expertise", "Leadership and Team Management", "Patient Care and Clinical Governance", "Research and Innovation"]**
- Lead with your strongest, most recent relevant example (STAR format where the evidence is substantial)
- Reference specific work history, projects, or qualifications from the profile
- Use **bold** to highlight key skills or role titles
- Action verbs: Led, Delivered, Developed, Managed, Implemented, Secured, Analysed, Designed, etc.

**[Theme 2 — e.g., "Stakeholder Engagement", "Commercial Acumen", "Communication and Collaboration"]**
[Specific evidence from the profile, most recent first]

**[Theme 3 onwards — extract from JD priorities]**
Continue for 4–6 themes most central to the JD.

**Summary**
2–3 sentence conclusion restating your fit and enthusiasm for this specific role and organisation.

---

WRITING RULES FOR BOTH MODES:
1. UK English throughout: organised, programme, behaviour, recognised, specialise, colour, centre, analyse, utilise
2. Evidence hierarchy: Within each section, lead with the most recent or most impactful example
3. Seniority-adaptive language:
   • GRADUATE/FRESHER: Lead with academic projects, dissertations, placements, volunteering, extracurricular roles
   • MID-LEVEL: Specific work achievements, professional development, collaborative delivery
   • SENIOR: Specialist expertise, team leadership, complex problem-solving, stakeholder management
   • DIRECTOR/EXECUTIVE: Strategic transformation, commercial outcomes, organisational change, board-level impact
4. DO NOT repeat the same example across multiple criteria or themes — use distinct evidence each time
5. DO NOT fabricate experience, metrics, or achievements not present in the profile data
6. DO NOT invent figures — only use numbers explicitly stated in the profile
7. Each criterion/theme section should be self-contained — it may be assessed independently by a panel
8. Industry-specific evidence framing:
   • Healthcare: patient outcomes, clinical standards, MDT working, CQC compliance, safeguarding, NMC/GMC/HCPC registration
   • Technology: system architecture, technical problem-solving, delivery at scale, specific technologies from profile
   • Academia: research methodology, publications or projects, teaching experience, supervision, grant contributions
   • Finance/Legal: regulatory environment, analytical rigour, risk management, commercial transactions
   • Public Sector: policy development, public value, governance, partnership working
   • Marketing/Creative: campaigns, audience outcomes, brand impact, ROI, creative direction
   • Executive: P&L, transformation programmes, culture change, organisational strategy
9. Target length: 2 A4 pages (approximately 800–1,000 words) unless the JD specifies a different length requirement
10. ${hasUserContent ? 'The existing draft is for context only — rewrite entirely based on the profile and JD' : 'Generate entirely from the profile and JD'}

OUTPUT FORMAT — Return ONLY a valid JSON array. No markdown, no code fences, no extra text.
Use only these block types:
  { "type": "cl-salutation", "data": { "text": "Dear [Name / Hiring Manager / Selection Panel]," } }
  { "type": "section-title", "data": { "title": "Exact criterion heading (Essential)" } }
  { "type": "text",          "data": { "text": "Prose paragraph content" } }
  { "type": "text",          "data": { "lines": ["First bullet item", "Second bullet item"] } }
  { "type": "cl-closing",    "data": { "text": "Yours sincerely,", "name": "" } }
Rules:
- The array MUST begin with a cl-salutation block
- The array MUST end with a cl-closing block
- Use section-title blocks for each criterion heading (CRITERIA MODE) or competency theme (COMPETENCY MODE)
- Do NOT include a cl-header block — sender contact details are added separately
- Use "text" with "text" field for prose paragraphs; use "text" with "lines" array for bullet lists
- Each bullet item in "lines" is plain text with NO leading dash, asterisk, or bullet character
- Return only the JSON array, nothing else
`;
  }

  try {
    let text = await generateWithFallback(prompt);
    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();
    return hydrateBlocks(JSON.parse(text));
  } catch (error) {
    console.error('Document generation error:', error);
    throw new Error('Failed to generate document');
  }
}

function hydrateBlocks(rawBlocks) {
  if (!Array.isArray(rawBlocks)) return [];
  return rawBlocks
    .filter((b) => b && b.type && b.data)
    .map((b) => {
      const d = b.data;
      switch (b.type) {
        case 'section-title':
          return createSectionTitleBlock(d.title || '');
        case 'subheading':
          return createSubheadingBlock({
            primary: d.primary || '',
            secondary: d.secondary || '',
            location: d.location || '',
            dateRange: d.dateRange || '',
          });
        case 'text':
          if (Array.isArray(d.lines) && d.lines.length > 0) {
            return createBlock(BLOCK_TYPES.TEXT, {
              text: d.lines.join('\n'),
              slateContent: slateFromLines(d.lines),
            });
          }
          return createTextBlock(d.text || '');
        case 'skill-group':
          return createSkillGroupBlock({
            label: d.label || '',
            skills: Array.isArray(d.skills) ? d.skills : [],
          });
        case 'cl-salutation':
          return createClSalutationBlock(d.text || 'Dear Hiring Manager,');
        case 'cl-closing':
          return createClClosingBlock({ text: d.text || 'Yours sincerely,', name: d.name || '' });
        default:
          return createTextBlock(d.text || '');
      }
    });
}

/**
 * Extract keywords from a job description using AI (one-time operation).
 * Returns only the list of keywords, no presence checking.
 *
 * Returns:
 *   {
 *     keywords: [{ keyword: string }],  // just the keyword strings
 *   }
 */
export async function extractKeywordsFromJob(jobDescription) {
  const prompt = `
You are an ATS (Applicant Tracking System) and recruitment keyword specialist.

Analyse the job description below and identify the key skills, qualifications, tools, technologies, and role-specific terms that the employer is looking for.

JOB DESCRIPTION / REQUIREMENTS:
${jobDescription.substring(0, 6000)}

INSTRUCTIONS:
1. Extract 15–30 keywords/phrases that are important to the employer (single words or short phrases, e.g. "Python", "project management", "stakeholder engagement", "Agile").
2. Include a mix of technical skills, soft skills, qualifications, tools, and role-specific terminology.
3. Return only the keywords - do NOT check against any resume text.

Return ONLY a valid JSON object in exactly this shape, no markdown, no code fences:
{
  "keywords": ["Python", "React", "stakeholder management", "Agile", "team leadership"]
}
`;

  try {
    let text = await generateWithFallback(prompt);
    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    const parsed = JSON.parse(text);
    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
    return {
      keywords: keywords.map((kw) => ({ keyword: typeof kw === 'string' ? kw : kw.keyword })),
    };
  } catch (error) {
    console.error('Keyword extraction error:', error);
    throw new Error('Failed to extract keywords from job description');
  }
}

/**
 * Check keyword presence in resume text (no AI, pure string matching).
 *
 * @param {Array} keywords - Array of keyword objects [{ keyword: string }]
 * @param {string} resumeText - The resume text content
 * @returns {Object} - { keywords: [{keyword, present}], score, summary }
 */
export function checkKeywordPresence(keywords, resumeText) {
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return {
      keywords: [],
      score: 0,
      summary: 'No keywords to check.',
    };
  }

  const textLower = resumeText.toLowerCase();

  // Check each keyword with case-insensitive substring matching
  const checkedKeywords = keywords.map((kw) => ({
    keyword: kw.keyword,
    present: textLower.includes(kw.keyword.toLowerCase()),
  }));

  const presentCount = checkedKeywords.filter((k) => k.present).length;
  const score = Math.round((presentCount / checkedKeywords.length) * 100);

  // Generate a simple summary based on the score
  let summary = '';
  if (score >= 90) {
    summary =
      'Excellent keyword coverage! Your resume includes almost all important terms from the job description.';
  } else if (score >= 75) {
    summary =
      'Good keyword coverage. Your resume includes most of the key terms employers are looking for.';
  } else if (score >= 50) {
    summary =
      'Moderate keyword coverage. Consider adding more technical skills and role-specific terms from the job description.';
  } else if (score >= 25) {
    summary =
      'Low keyword coverage. Your resume is missing several important terms that may be flagged by ATS systems.';
  } else {
    summary =
      'Very low keyword coverage. Consider tailoring your resume to include more skills and terms from the job description.';
  }

  const missingKeywords = checkedKeywords.filter((k) => !k.present);
  if (missingKeywords.length > 0 && missingKeywords.length <= 5) {
    const missing = missingKeywords
      .slice(0, 3)
      .map((k) => k.keyword)
      .join(', ');
    summary += ` Missing key terms: ${missing}.`;
  }

  return {
    keywords: checkedKeywords,
    keywordsPresent: checkedKeywords.filter((k) => k.present).map((k) => k.keyword),
    keywordsMissing: checkedKeywords.filter((k) => !k.present).map((k) => k.keyword),
    score,
    summary,
  };
}

// Generate interview Q&A for a job
export async function generateInterviewQuestions({
  jobTitle,
  company,
  jobDescription,
  requirements,
  userProfile,
  level,
  type,
  count,
  existingQuestions = [],
}) {
  const levelDescriptions = {
    fresh: 'entry-level / fresh graduate (0–2 years experience)',
    mid: 'mid-level professional (3–5 years experience)',
    senior: 'senior professional (6+ years experience)',
  };

  const typeDescriptions = {
    technical:
      'technical / skills-based questions focused on hard skills, tools, frameworks, and domain knowledge relevant to the role',
    behavioural:
      'behavioural questions using the STAR method (Situation, Task, Action, Result) focused on soft skills, past experiences, and workplace scenarios',
    mixed: 'a balanced mix of technical and behavioural questions',
  };

  const profileSection = userProfile
    ? `\nCandidate Profile:
- Summary: ${userProfile.profile?.summary || 'Not provided'}
- Skills: ${JSON.stringify(userProfile.profile?.skills || {})}
- Recent Experience: ${JSON.stringify((userProfile.profile?.experiences || []).slice(0, 3))}
`
    : '';

  const existingSection =
    existingQuestions.length > 0
      ? `\nEXISTING QUESTIONS (do NOT repeat or closely paraphrase any of these):\n${existingQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}\n`
      : '';

  const prompt = `You are an expert interview coach helping candidates prepare for job interviews.

Generate exactly ${count} NEW ${typeDescriptions[type] || typeDescriptions.technical} interview questions for the following role.

Job Details:
- Title: ${jobTitle || 'Not specified'}
- Company: ${company || 'Not specified'}
- Description: ${(jobDescription || '').substring(0, 3000)}
- Requirements: ${(requirements || '').substring(0, 2000)}
${profileSection}${existingSection}
Candidate Level: ${levelDescriptions[level] || levelDescriptions.mid}

Instructions:
- Tailor questions to the specific role, company, and requirements above
- Difficulty must match the candidate level
- For technical questions: focus on skills and concepts mentioned in the job description
- For behavioural questions: use realistic workplace scenarios relevant to this role
- Model answers should be specific, detailed, and reference the job context where appropriate
- Each "tip" should tell the candidate what the interviewer is really looking for
${existingQuestions.length > 0 ? '- You MUST generate completely different questions from the existing list above\n' : ''}
Return a valid JSON array with exactly ${count} objects. Each object must have:
{
  "question": "The interview question",
  "answer": "A strong model answer (150–300 words) a well-prepared candidate should give",
  "tip": "What the interviewer is really assessing (1–2 sentences)"
}

Return ONLY the JSON array. No markdown, no code fences, no explanation.`;

  try {
    let text = await generateWithFallback(prompt);
    text = text.trim();
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
    return parsed;
  } catch (error) {
    console.error('Interview question generation error:', error);
    throw new Error('Failed to generate interview questions');
  }
}
