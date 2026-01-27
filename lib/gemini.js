import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

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
    const text = response.text()
    
    // Clean up the response - remove markdown code blocks if present
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7)
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3)
    }
    
    return JSON.parse(cleanText.trim())
  } catch (error) {
    console.error('Gemini extraction error:', error)
    throw new Error('Failed to extract job details')
  }
}

export async function refineDocument(documentType, content, jobDescription, userPreferences = '') {
  const model = getGeminiModel()
  
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
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Document refinement error:', error)
    throw new Error('Failed to refine document')
  }
}
