import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001']

export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  return genAI.getGenerativeModel({ model: modelName })
}

// Try multiple models with fallback
async function generateWithFallback(prompt) {
  const models = geminiModels
  let lastError = null
  
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying ${modelName} (attempt ${attempt})...`)
        const model = getGeminiModel(modelName)
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      } catch (error) {
        console.error(`${modelName} attempt ${attempt} failed:`, error.message)
        lastError = error
        
        const errorMsg = error.message || String(error)
        if (errorMsg.includes('overloaded') || errorMsg.includes('503') || errorMsg.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else if (!errorMsg.includes('404')) {
          // For non-404 errors that aren't rate limits, try next model
          break
        }
      }
    }
  }
  
  throw lastError || new Error('All models failed')
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
- Possible Descriptions: ${JSON.stringify(scrapedData.possibleDescriptions.slice(0, 3).map(d => d.substring(0, 2000)))}

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
`

  try {
    let text = await generateWithFallback(prompt)
    console.log('[Gemini] Raw response (first 1000 chars):', text.substring(0, 1000))
    
    // Clean up response - remove markdown code blocks if present
    text = text.trim()
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()
    
    console.log('[Gemini] Cleaned response (first 1000 chars):', text.substring(0, 1000))
    
    const parsed = JSON.parse(text)
    console.log('[Gemini] Parsed object keys:', Object.keys(parsed))
    console.log('[Gemini] Parsed title:', parsed.title)
    console.log('[Gemini] Parsed company:', parsed.company)
    
    // Validate and clean the response
    return {
      title: parsed.title || null,
      company: parsed.company || null,
      location: parsed.location || null,
      salary: parsed.salary || null,
      closingDate: parsed.closingDate || null,
      description: parsed.description || null,
      requirements: parsed.requirements || null,
      benefits: parsed.benefits || null
    }
  } catch (error) {
    console.error('Gemini classification error:', error)
    throw new Error('Failed to classify job data - AI service unavailable')
  }
}

// Legacy function - extract job details from raw HTML content
export async function extractJobDetailsFromHTML(url, htmlContent) {
  const model = getGeminiModel()
  
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
`
  
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()
    
    // Clean up the response
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    
    return JSON.parse(text.trim())
  } catch (error) {
    console.error('Gemini extraction error:', error)
    throw new Error('Failed to extract job details')
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
`

  try {
    let responseText = await generateWithFallback(prompt)
    console.log('[Gemini] Text extraction raw response (first 1000 chars):', responseText.substring(0, 1000))
    
    // Clean up response - remove markdown code blocks if present
    responseText = responseText.trim()
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7)
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3)
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3)
    }
    responseText = responseText.trim()
    
    console.log('[Gemini] Cleaned response (first 1000 chars):', responseText.substring(0, 1000))
    
    const parsed = JSON.parse(responseText)
    console.log('[Gemini] Parsed object keys:', Object.keys(parsed))
    console.log('[Gemini] Parsed title:', parsed.title)
    console.log('[Gemini] Parsed company:', parsed.company)
    
    // Validate and clean the response
    return {
      title: parsed.title || null,
      company: parsed.company || null,
      location: parsed.location || null,
      salary: parsed.salary || null,
      closingDate: parsed.closingDate || null,
      description: parsed.description || null,
      requirements: parsed.requirements || null,
      benefits: parsed.benefits || null
    }
  } catch (error) {
    console.error('Gemini text extraction error:', error)
    throw new Error('Failed to extract job details from text - AI service unavailable')
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
      "startDate": "mm/yyyy",
      "endDate": "mm/yyyy or Present",
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
      "graduationDate": "mm/yyyy or graduation year"
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
1. Extract dates in mm/yyyy format (e.g., "01/2023" or "12/2022")
2. Use "Present" for current positions
3. If information is not found, use empty string "" or empty array []
4. For experiences, extract ALL work history entries
5. For education, extract ALL education entries as an array (degrees, diplomas, certifications)
6. Preserve bullet points in descriptions but format as plain text with line breaks
7. Return ONLY the JSON object, nothing else
`

  // Use Gemini's native PDF processing with inlineData format
  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Content
      }
    }
  ]

  const models = geminiModels
  let lastError = null
  
  for (const modelName of models) {
    try {
      console.log(`[Gemini] Parsing resume with ${modelName}...`)
      const model = getGeminiModel(modelName)
      const result = await model.generateContent(contents)
      const response = await result.response
      let text = response.text()
      
      console.log('[Gemini] Resume parsing raw response (first 1000 chars):', text.substring(0, 1000))
      
      // Clean up response
      text = text.trim()
      if (text.startsWith('```json')) {
        text = text.slice(7)
      } else if (text.startsWith('```')) {
        text = text.slice(3)
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3)
      }
      text = text.trim()
      
      const parsed = JSON.parse(text)
      console.log('[Gemini] Successfully parsed resume data')
      
      // Ensure proper structure with defaults
      const education = Array.isArray(parsed.education) 
        ? parsed.education 
        : (parsed.education ? [parsed.education] : [])
      
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
        achievements: parsed.achievements || ''
      }
    } catch (error) {
      console.error(`${modelName} resume parsing failed:`, error.message)
      lastError = error
      // Try next model
      continue
    }
  }
  
  console.error('Resume parsing error:', lastError)
  throw new Error('Failed to parse resume: ' + (lastError?.message || 'All models failed'))
}

// Refine documents with AI - structured for proper resume format
export async function refineDocument(documentType, content, jobDescription, userPreferences = '', userProfile = null) {
  
  let prompt = ''
  
  if (documentType === 'resume' && userProfile) {
    // Resume generation from structured profile data
    prompt = `
You are an expert resume writer. Create a tailored, ATS-friendly resume based on the candidate's profile data and the job description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE DATA:
${content}

${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}` : ''}

RESUME STRUCTURE (MANDATORY - Follow EXACTLY):

# SUMMARY
Write 2-3 sentences highlighting the most relevant experience and skills for THIS job. Use keywords from the job description.

# RELEVANT WORK EXPERIENCE
List ALL work experiences in REVERSE CHRONOLOGICAL ORDER (most recent first). Format each as:
**[Job Title] | [Company], [Location] | [Start Date] - [End Date]**
- [Achievement/responsibility using action verbs - most relevant first]
- [Achievement with metrics if available]
- [Achievement relevant to job requirements]
- [Additional relevant point]

# EDUCATION
List education in REVERSE CHRONOLOGICAL ORDER (most recent first). Format each as:
**[Degree] | [Grade if notable] | [Start] - [End]**
[Institution], [Location]

# SKILLS
**Relevant Skills**
[Top skills that match the job requirements, comma separated]

**Other Skills**
[Additional transferable skills, comma separated]

# PROJECTS
List projects in REVERSE CHRONOLOGICAL ORDER or by relevance. Format each as:
**[Project Title] | [URL if available]**
[2-3 line description: tech stack, problem solved, impact]

# INTERESTS
(Optional - only if space allows)
**[Interest Title]**
[1 line description]

CRITICAL RULES:
1. DO NOT include header information (name, email, phone, LinkedIn, portfolio) - this will be added separately
2. DO NOT fabricate any information - only use what's in the profile
3. DO NOT add metrics or achievements not present in the original data
4. Work experience MUST be in chronological order (most recent first), NOT by relevance
5. Education MUST be in chronological order (most recent first), NOT by relevance
6. Reorder and rephrase existing content to match job requirements within each entry
7. Use action verbs: Led, Developed, Implemented, Achieved, Managed, etc.
8. Include relevant keywords from the job description naturally
9. Keep content concise - this must fit on 2 A4 pages maximum
10. Skills section should start on page 2

Output the resume content in markdown format WITHOUT any header section.
`
  } else if (documentType === 'coverLetter') {
    // Cover Letter generation
    const hasUserContent = content && content.trim().length > 0
    
    prompt = `
You are an expert career coach creating a compelling cover letter.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE DATA:
${userProfile ? JSON.stringify(userProfile) : 'Not provided'}

${hasUserContent ? `EXISTING DRAFT (use as inspiration but rewrite completely):
${content}

` : ''}${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}

` : ''}
COVER LETTER STRUCTURE:

**Opening Paragraph**
- Express genuine interest in the specific role
- Mention the company name
- Brief statement of why you're a strong candidate

**Body Paragraph 1**
- Highlight most relevant work experience from the candidate's profile
- Use specific examples with action verbs
- Connect experience to job requirements
- Support with bold keywords: **key skill** or **achievement**

**Body Paragraph 2**
- Demonstrate additional skills and achievements
- Reference education if relevant
- Show understanding of company/role
- Use bullet points if listing multiple relevant skills:
  - First relevant skill or achievement
  - Second relevant skill or achievement
  - Third relevant skill or achievement

**Closing Paragraph**
- Express enthusiasm for the opportunity
- Request interview/further discussion
- Thank them for their consideration
- Professional sign-off

FORMATTING RULES:
1. Use **bold** for emphasis on key skills, achievements, or company names
2. Use *italics* for subtle emphasis where appropriate
3. Use bullet points (-) for listing multiple items within paragraphs
4. Use proper paragraph breaks for readability
5. Keep professional tone throughout

CONTENT RULES:
1. Generate the cover letter PRIMARILY from the job description and candidate profile data
2. Only use information from the provided profile - DO NOT fabricate experiences
3. ${hasUserContent ? 'The existing draft is optional guidance - rewrite completely based on profile' : 'Generate entirely from profile data'}
4. Match the tone to the job/company culture evident in the description
5. Use keywords from the job description naturally
6. Maximum 2 A4 pages
7. Be specific with examples from the candidate's actual experience
8. Order experiences chronologically when referencing them

Output the cover letter in markdown format with proper formatting (bold, italics, bullets).
`
  } else if (documentType === 'supportingStatement') {
    // Supporting Statement generation
    const hasUserContent = content && content.trim().length > 0
    
    prompt = `
You are an expert career coach creating a detailed supporting statement.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE DATA:
${userProfile ? JSON.stringify(userProfile) : 'Not provided'}

${hasUserContent ? `EXISTING DRAFT (use as inspiration but rewrite completely):
${content}

` : ''}${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}

` : ''}
SUPPORTING STATEMENT STRUCTURE:

**Introduction**
Brief paragraph introducing yourself and expressing interest in the position.

**[Requirement 1 from Job Description]**
- Use the STAR format where possible:
  - **Situation:** Context from candidate's experience
  - **Task:** What needed to be done
  - **Action:** Specific actions taken (use action verbs)
  - **Result:** Measurable outcomes or achievements
- Draw from relevant work experience in chronological context
- Use bullet points for clarity

**[Requirement 2 from Job Description]**
- Provide evidence from education or work experience
- Use **bold** to highlight key skills demonstrated
- Reference specific projects or achievements from profile
- Sub-bullets can elaborate on main points:
  - Main point
    - Supporting detail
    - Additional evidence

**[Requirement 3 from Job Description]**
Continue addressing each major requirement...

**Additional Skills and Qualities**
- List other relevant competencies from profile
- Use *italics* for emphasis on transferable skills
- Organize chronologically when referencing multiple experiences

**Conclusion**
Summarize key strengths and express enthusiasm for the role.

FORMATTING RULES:
1. Use **bold** for headings, key skills, and important achievements
2. Use *italics* for subtle emphasis or when referencing specific techniques/methodologies
3. Use bullet points (-) for main points
4. Use sub-bullets (  -) indented for supporting details
5. Use paragraph breaks for readability
6. Keep professional and formal tone

CONTENT RULES:
1. Generate the statement PRIMARILY from the job description and candidate profile data
2. Match each requirement in the job description with evidence from the profile
3. Only use information from the provided profile - DO NOT fabricate experiences
4. ${hasUserContent ? 'The existing draft is optional guidance - rewrite completely based on profile' : 'Generate entirely from profile data'}
5. Work experiences MUST be referenced in chronological order (most recent first)
6. Education should be referenced chronologically when relevant
7. Be specific with examples from actual experiences
8. Use the STAR format for stronger evidence
9. Maximum 3 A4 pages
10. Address as many job requirements as possible

Output the supporting statement in markdown format with proper formatting (bold, italics, bullets, sub-bullets).
`
  }
  
  try {
    return await generateWithFallback(prompt)
  } catch (error) {
    console.error('Document refinement error:', error)
    throw new Error('Failed to refine document')
  }
}
