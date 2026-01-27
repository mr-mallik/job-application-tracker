import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  return genAI.getGenerativeModel({ model: modelName })
}

// Try multiple models with fallback
async function generateWithFallback(prompt) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001']
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

// Parse resume PDF to extract structured profile data
export async function parseResumePDF(base64Content) {
  const prompt = `
You are a resume parsing expert. Extract structured information from this resume and return it as a JSON object.

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
  "education": {
    "degree": "Degree name",
    "institution": "Institution name",
    "location": "Location",
    "grade": "Grade/GPA if mentioned",
    "startDate": "mm/yyyy",
    "endDate": "mm/yyyy"
  },
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
5. For education, if multiple degrees, use the most recent one
6. Preserve bullet points in descriptions but format as plain text with line breaks
7. Return ONLY the JSON object, nothing else

Resume content (base64): ${base64Content.substring(0, 100000)}
`

  try {
    let text = await generateWithFallback(prompt)
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
    return {
      name: parsed.name || '',
      designation: parsed.designation || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      linkedin: parsed.linkedin || '',
      portfolio: parsed.portfolio || '',
      summary: parsed.summary || '',
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences : [],
      education: parsed.education || { degree: '', institution: '', location: '', grade: '', startDate: '', endDate: '' },
      skills: parsed.skills || { relevant: '', other: '' },
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      achievements: parsed.achievements || ''
    }
  } catch (error) {
    console.error('Resume parsing error:', error)
    throw new Error('Failed to parse resume: ' + error.message)
  }
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
Select the 4 most relevant positions. Format each as:
**[Job Title] | [Company], [Location] | [Start Date] - [End Date]**
- [Achievement/responsibility using action verbs - most relevant first]
- [Achievement with metrics if available]
- [Achievement relevant to job requirements]
- [Additional relevant point]

# EDUCATION
**[Degree] | [Grade if notable] | [Start] - [End]**
[Institution], [Location]

# SKILLS
**Relevant Skills**
[Top 7 skills that match the job requirements, comma separated]

**Other Skills**
[7 additional transferable skills, comma separated]

# PROJECTS
Select 3 most relevant projects. Format each as:
**[Project Title] | [URL if available]**
[2-3 line description: tech stack, problem solved, impact]

# INTERESTS
(Optional - only if space allows)
**[Interest Title]**
[1 line description]

CRITICAL RULES:
1. DO NOT fabricate any information - only use what's in the profile
2. DO NOT add metrics or achievements not present in the original data
3. Reorder and rephrase existing content to match job requirements
4. Use action verbs: Led, Developed, Implemented, Achieved, Managed, etc.
5. Include relevant keywords from the job description naturally
6. Keep content concise - this must fit on 2 A4 pages maximum
7. Skills section should start on page 2

Output the resume content in markdown format.
`
  } else {
    // Cover Letter or Supporting Statement
    const docGuidelines = {
      coverLetter: `Create a compelling cover letter (max 2 A4 pages).

Structure:
1. Opening paragraph: Express interest, mention the specific role and company
2. Body paragraph 1: Highlight most relevant experience (use specific examples from the content provided)
3. Body paragraph 2: Demonstrate skills and achievements that match requirements
4. Closing paragraph: Express enthusiasm, request interview, thank them

RULES:
- Only use information from the provided content
- Do NOT fabricate experiences or achievements
- Match the tone to the job/company
- Use keywords from the job description`,

      supportingStatement: `Create a detailed supporting statement (max 3 A4 pages).

Structure:
- For each key requirement in the job description, provide evidence from the provided content
- Use the STAR format where possible (Situation, Task, Action, Result)
- Organize by themes or requirements

RULES:
- Only use information from the provided content
- Do NOT fabricate experiences
- Address as many job requirements as possible
- Be specific with examples`
    }

    prompt = `
You are an expert career coach.

Document Type: ${documentType.toUpperCase()}

${docGuidelines[documentType]}

JOB DESCRIPTION:
${jobDescription}

${userPreferences ? `ADDITIONAL INSTRUCTIONS: ${userPreferences}` : ''}

CONTENT TO REFINE:
${content}

Provide the refined document in markdown format.
`
  }
  
  try {
    return await generateWithFallback(prompt)
  } catch (error) {
    console.error('Document refinement error:', error)
    throw new Error('Failed to refine document')
  }
}
