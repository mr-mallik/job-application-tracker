import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
    resume: 'Create a professional resume that fits within 2 sides of A4. Focus on relevant experience, skills, and achievements. Use clear sections: Contact Info, Summary, Experience, Skills, Education.',
    coverLetter: 'Write a compelling cover letter within 2 sides of A4. Include: Opening with position interest, why you are a fit, relevant achievements, and a strong closing.',
    supportingStatement: 'Create a detailed supporting statement within 3 sides of A4. Address how you meet each requirement in the job description with specific examples and evidence.'
  }
  
  const prompt = `
You are an expert career coach helping to create application documents.

Document Type: ${documentType.toUpperCase()}
Guidelines: ${documentGuidelines[documentType]}

Job Description:
${jobDescription}

${userPreferences ? `User Preferences/Notes:\n${userPreferences}\n` : ''}

Original Content/Information:
${content}

Create a polished, professional ${documentType} that:
1. Highlights relevant skills and experiences matching the job requirements
2. Uses appropriate keywords from the job description
3. Is well-structured with clear sections
4. Maintains a professional tone
5. Does NOT fabricate experiences or qualifications

Provide the refined document content only, formatted properly for the document type.
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
