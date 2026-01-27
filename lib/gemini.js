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

// Refine documents with AI - improved to not hallucinate
export async function refineDocument(documentType, content, jobDescription, userPreferences = '') {
  const documentGuidelines = {
    resume: `Refine this resume to better align with the job description. 
IMPORTANT RULES:
- DO NOT add any information that is not already in the original content
- DO NOT fabricate experiences, skills, certifications, or qualifications
- DO NOT add metrics or numbers that are not already present
- Focus ONLY on:
  1. Reordering existing content to highlight relevant experience first
  2. Rephrasing existing achievements using keywords from the job description
  3. Strengthening existing bullet points with action verbs
  4. Ensuring consistent formatting
- Keep the resume to max 2 A4 pages
- Use Harvard single-column style with clear sections: Contact, Summary, Experience, Skills, Education`,
    
    coverLetter: `Refine this cover letter to better align with the job description.
IMPORTANT RULES:
- DO NOT add experiences or achievements not mentioned in the original content
- DO NOT fabricate any information
- Focus ONLY on:
  1. Improving the flow and structure
  2. Using relevant keywords from the job description
  3. Strengthening the connection between existing experience and job requirements
  4. Making the opening and closing more compelling
- Keep to max 2 A4 pages`,
    
    supportingStatement: `Refine this supporting statement to better align with the job description.
IMPORTANT RULES:
- DO NOT add experiences or qualifications not in the original content
- DO NOT fabricate any information
- Focus ONLY on:
  1. Better organizing existing content to address job requirements
  2. Using specific keywords from the job description
  3. Providing clearer structure with evidence from the original content
  4. Strengthening existing examples
- Keep to max 3 A4 pages`
  }
  
  const prompt = `
You are an expert career coach helping to refine application documents.

Document Type: ${documentType.toUpperCase()}

${documentGuidelines[documentType]}

Job Description:
${jobDescription}

${userPreferences ? `User's Additional Instructions:\n${userPreferences}\n` : ''}

Original Content to Refine:
${content}

CRITICAL: Only use information that exists in the original content. Your job is to refine and optimize existing content, NOT to add new information. If the original content is sparse, work with what's there - do not invent details.

Provide the refined document content only, formatted properly in markdown for the document type.
`
  
  try {
    return await generateWithFallback(prompt)
  } catch (error) {
    console.error('Document refinement error:', error)
    throw new Error('Failed to refine document')
  }
}
