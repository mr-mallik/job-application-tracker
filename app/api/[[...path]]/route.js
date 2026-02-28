import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createUser, verifyUserEmail, loginUser, getUserFromToken, updateUserProfile, resetPasswordRequest, resetPassword, changePassword, deleteUserAccount, sendEmail } from '@/lib/auth'
import { scrapeWithPlaywright, parseWithCheerio, detectJobBoard } from '@/lib/scraper'
import { classifyJobData, refineDocument } from '@/lib/gemini'
import { getCollection } from '@/lib/db'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'job_tracker')
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Helper function to parse dates (mm/yyyy format)
function parseDate(dateString) {
  if (!dateString || dateString.toLowerCase() === 'present') {
    return new Date() // Current date for "Present"
  }
  const parts = dateString.split('/')
  if (parts.length === 2) {
    const month = parseInt(parts[0]) - 1
    const year = parseInt(parts[1])
    return new Date(year, month)
  }
  return new Date(0) // Default to epoch if invalid
}

async function getAuthUser(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  return getUserFromToken(token)
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Job Tracker API v1.0' }))
    }

    // ============ AUTH ROUTES ============
    
    // Register
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, name } = body
      
      if (!email || !password || !name) {
        return handleCORS(NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 }))
      }
      
      try {
        const user = await createUser(email, password, name)
        return handleCORS(NextResponse.json({ message: 'Registration successful. Check console for verification code.', user }))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
    }
    
    // Verify email
    if (route === '/auth/verify' && method === 'POST') {
      const body = await request.json()
      const { email, code } = body
      
      try {
        await verifyUserEmail(email, code)
        return handleCORS(NextResponse.json({ message: 'Email verified successfully' }))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
    }
    
    // Login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      
      try {
        const result = await loginUser(email, password)
        return handleCORS(NextResponse.json(result))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 401 }))
      }
    }
    
    // Get current user
    if (route === '/auth/me' && method === 'GET') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      return handleCORS(NextResponse.json({ user }))
    }
    
    // Update profile
    if (route === '/auth/profile' && method === 'PUT') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const updatedUser = await updateUserProfile(user.id, body)
      return handleCORS(NextResponse.json({ user: updatedUser }))
    }
    
    // Parse resume PDF
    if (route === '/auth/parse-resume' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { base64Content } = body
      
      if (!base64Content) {
        return handleCORS(NextResponse.json({ error: 'Resume content is required' }, { status: 400 }))
      }
      
      try {
        const { parseResumePDF } = await import('@/lib/gemini')
        console.log('[API] Parsing resume PDF with Gemini...')
        const profileData = await parseResumePDF(base64Content)
        
        // Sort experiences and education chronologically (most recent first)
        if (profileData.experiences && profileData.experiences.length > 0) {
          profileData.experiences.sort((a, b) => {
            const dateA = parseDate(a.startDate)
            const dateB = parseDate(b.startDate)
            return dateB - dateA // Descending order (most recent first)
          })
        }
        
        console.log('[API] Resume parsed successfully')
        return handleCORS(NextResponse.json({ profileData }))
      } catch (error) {
        console.error('[API] Resume parsing error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to parse resume: ' + error.message }, { status: 500 }))
      }
    }
    
    // Request password reset
    if (route === '/auth/forgot-password' && method === 'POST') {
      const body = await request.json()
      const { email } = body
      
      await resetPasswordRequest(email)
      return handleCORS(NextResponse.json({ message: 'If an account exists, reset code was sent. Check console.' }))
    }
    
    // Reset password
    if (route === '/auth/reset-password' && method === 'POST') {
      const body = await request.json()
      const { email, code, newPassword } = body
      
      try {
        await resetPassword(email, code, newPassword)
        return handleCORS(NextResponse.json({ message: 'Password reset successful' }))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
    }

    // Change password (authenticated)
    if (route === '/auth/change-password' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { currentPassword, newPassword } = body
      
      if (!currentPassword || !newPassword) {
        return handleCORS(NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 }))
      }
      
      try {
        await changePassword(user.id, currentPassword, newPassword)
        return handleCORS(NextResponse.json({ message: 'Password changed successfully' }))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
    }

    // Delete account (authenticated)
    if (route === '/auth/delete-account' && method === 'DELETE') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      try {
        await deleteUserAccount(user.id)
        return handleCORS(NextResponse.json({ message: 'Account deleted successfully' }))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }
    }

    // ============ JOB ROUTES ============
    
    // Scrape job from URL using Playwright + Cheerio + Gemini AI
    if (route === '/jobs/scrape' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { url } = body
      
      if (!url) {
        return handleCORS(NextResponse.json({ error: 'URL is required' }, { status: 400 }))
      }
      
      try {
        console.log(`[Scraper] Starting scrape for: ${url}`)
        const jobBoard = detectJobBoard(url)
        console.log(`[Scraper] Detected job board: ${jobBoard}`)
        
        // Step 1: Use Browserless to fetch the page (handles JavaScript rendering)
        console.log('[Scraper] Step 1: Fetching page with Browserless...')
        const scrapedResult = await scrapeWithPlaywright(url)
        const { html, visibleText, method } = scrapedResult
        console.log(`[Scraper] Page fetched using: ${method || 'unknown'}`)
        console.log(`[Scraper] HTML length: ${html.length}, Text length: ${visibleText.length}`)
        
        // Validate we have sufficient content before proceeding
        if (!html || html.length < 1000 || !visibleText || visibleText.length < 500) {
          console.error('[Scraper] Insufficient content. Likely an auth page or error.')
          return handleCORS(NextResponse.json({ 
            error: 'Unable to extract job details. The URL may require authentication (login), be a search results page instead of a specific job posting, or the page did not load properly. Please try: 1) A direct link to a single job posting, 2) Logging in first and copying the job description text to use "Paste Text" mode instead.'
          }, { status: 400 }))
        }
        
        // Step 2: Parse with Cheerio to extract structured data
        console.log('[Scraper] Step 2: Parsing with Cheerio...')
        const scrapedData = parseWithCheerio(html, url)
        scrapedData.visibleText = visibleText
        console.log(`[Scraper] Extracted - Titles: ${scrapedData.possibleTitles.length}, Companies: ${scrapedData.possibleCompanies.length}`)
        console.log('[Scraper] Possible Titles:', JSON.stringify(scrapedData.possibleTitles.slice(0, 5)))
        console.log('[Scraper] Raw text excerpt:', scrapedData.rawText?.substring(0, 500) || visibleText?.substring(0, 500))
        
        // Validate we have meaningful data before calling Gemini
        const hasValidData = (
          (scrapedData.possibleTitles.length > 0 && scrapedData.possibleTitles[0] !== 'Sign in' && scrapedData.possibleTitles[0].length > 5) ||
          (scrapedData.possibleDescriptions.length > 0 && scrapedData.possibleDescriptions[0].length > 200) ||
          visibleText.length > 2000
        )
        
        if (!hasValidData) {
          console.error('[Scraper] No valid job data found. Skipping Gemini call.')
          return handleCORS(NextResponse.json({ 
            error: 'No job posting found at this URL. This might be a login page, search results page, or expired listing. Try using "Paste Text" mode instead.'
          }, { status: 400 }))
        }
        
        // Step 3: Use Gemini AI to classify and structure the data
        console.log('[Scraper] Step 3: Classifying with Gemini AI...')
        const jobDetails = await classifyJobData(scrapedData, url)
        console.log(`[Scraper] Classification complete. Title: ${jobDetails.title}`)
        
        return handleCORS(NextResponse.json({ 
          jobDetails,
          meta: {
            jobBoard,
            scrapedAt: new Date().toISOString(),
            method: method || 'unknown'
          }
        }))
      } catch (error) {
        console.error('[Scraper] Error:', error)
        
        // Provide helpful error messages based on error type
        let userMessage = error.message
        if (error.message.includes('authentication') || error.message.includes('Login')) {
          userMessage = 'This page requires login. Please log in to the job site first, then copy and paste the job description using "Paste Text" mode.'
        } else if (error.message.includes('validation failed')) {
          userMessage = 'Unable to extract job details from this page. Try using "Paste Text" mode instead.'
        }
        
        return handleCORS(NextResponse.json({ error: userMessage }, { status: 500 }))
      }
    }
    
    // Extract job details from pasted text using Gemini AI
    if (route === '/jobs/extract-text' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { text } = body
      
      if (!text) {
        return handleCORS(NextResponse.json({ error: 'Job description text is required' }, { status: 400 }))
      }
      
      try {
        console.log(`[Text Extraction] Starting extraction from pasted text (${text.length} chars)`)
        
        // Use Gemini AI to extract structured data from text
        console.log('[Text Extraction] Extracting with Gemini AI...')
        const { extractJobDetailsFromText } = await import('@/lib/gemini')
        const jobDetails = await extractJobDetailsFromText(text)
        console.log(`[Text Extraction] Extraction complete. Title: ${jobDetails.title}`)
        
        return handleCORS(NextResponse.json({ 
          jobDetails,
          meta: {
            extractedAt: new Date().toISOString(),
            source: 'text'
          }
        }))
      } catch (error) {
        console.error('[Text Extraction] Error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to extract job details: ' + error.message }, { status: 500 }))
      }
    }
    
    // Get all jobs for user
    if (route === '/jobs' && method === 'GET') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const jobs = await db.collection('jobs')
        .find({ userId: user.id })
        .sort({ closingDate: -1 })
        .toArray()
      
      const cleanJobs = jobs.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ jobs: cleanJobs }))
    }
    
    // Create job application
    if (route === '/jobs' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const job = {
        id: uuidv4(),
        userId: user.id,
        title: body.title || '',
        company: body.company || '',
        location: body.location || '',
        salary: body.salary || '',
        closingDate: body.closingDate || null,
        appliedDate: body.appliedDate || new Date().toISOString().split('T')[0],
        status: body.status || 'saved',
        url: body.url || '',
        description: body.description || '',
        requirements: body.requirements || '',
        benefits: body.benefits || '',
        notes: body.notes || '',
        rejectionFeedback: '',
        reminder: {
          enabled: body.reminder?.enabled || false,
          daysBefore: body.reminder?.daysBefore || null // null means use system defaults (7 and 1 day)
        },
        resume: { content: '', refinedContent: '' },
        coverLetter: { content: '', refinedContent: '' },
        supportingStatement: { content: '', refinedContent: '' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('jobs').insertOne(job)
      const { _id, ...cleanJob } = job
      return handleCORS(NextResponse.json({ job: cleanJob }, { status: 201 }))
    }
    
    // Get single job
    if (route.match(/^\/jobs\/[^/]+$/) && method === 'GET') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const jobId = path[1]
      const job = await db.collection('jobs').findOne({ id: jobId, userId: user.id })
      
      if (!job) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }))
      }
      
      const { _id, ...cleanJob } = job
      return handleCORS(NextResponse.json({ job: cleanJob }))
    }
    
    // Update job
    if (route.match(/^\/jobs\/[^/]+$/) && method === 'PUT') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const jobId = path[1]
      const body = await request.json()
      
      const updates = { updatedAt: new Date() }
      const allowedFields = ['title', 'company', 'location', 'salary', 'closingDate', 'appliedDate', 'status', 'url', 'description', 'requirements', 'benefits', 'notes', 'rejectionFeedback', 'resume', 'coverLetter', 'supportingStatement', 'reminder']
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field]
        }
      }
      
      const result = await db.collection('jobs').updateOne(
        { id: jobId, userId: user.id },
        { $set: updates }
      )
      
      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }))
      }
      
      const job = await db.collection('jobs').findOne({ id: jobId })
      const { _id, ...cleanJob } = job
      return handleCORS(NextResponse.json({ job: cleanJob }))
    }
    
    // Delete job
    if (route.match(/^\/jobs\/[^/]+$/) && method === 'DELETE') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const jobId = path[1]
      const result = await db.collection('jobs').deleteOne({ id: jobId, userId: user.id })
      
      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }))
      }
      
      return handleCORS(NextResponse.json({ message: 'Job deleted' }))
    }

    // ============ REMINDER ROUTES ============
    
    // Check and send reminders for upcoming deadlines
    if (route === '/reminders/check' && method === 'POST') {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Find all jobs with reminders enabled, status is "saved", and have a closing date
        const jobs = await db.collection('jobs').find({
          'reminder.enabled': true,
          status: 'saved',
          closingDate: { $ne: null, $exists: true }
        }).toArray()
        
        console.log(`[Reminders] Found ${jobs.length} jobs with reminders enabled`)
        
        const remindersSent = []
        const errors = []
        
        for (const job of jobs) {
          try {
            // Skip if no closing date
            if (!job.closingDate) continue
            
            // Parse closing date
            const closingDate = new Date(job.closingDate)
            closingDate.setHours(0, 0, 0, 0)
            
            // Calculate days until deadline
            const daysUntilDeadline = Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24))
            
            // Skip if deadline has passed
            if (daysUntilDeadline < 0) {
              console.log(`[Reminders] Skipping job ${job.id} - deadline passed`)
              continue
            }
            
            // Determine if reminder should be sent
            let shouldSend = false
            
            if (job.reminder.daysBefore !== null && job.reminder.daysBefore !== undefined) {
              // User has set custom reminder
              shouldSend = daysUntilDeadline === job.reminder.daysBefore
            } else {
              // Use system defaults: 7 days and 1 day before
              shouldSend = daysUntilDeadline === 7 || daysUntilDeadline === 1
            }
            
            if (shouldSend) {
              // Get user email
              const user = await db.collection('users').findOne({ id: job.userId })
              if (!user || !user.email) {
                console.log(`[Reminders] Skipping job ${job.id} - user not found`)
                continue
              }
              
              // Format deadline date
              const deadlineFormatted = closingDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
              
              // Compose email
              const subject = `⏰ Reminder: ${job.title} application deadline approaching`
              const text = `Hi ${user.name || 'there'},

This is a reminder that the application deadline for the following job is approaching:

Job Title: ${job.title}
Company: ${job.company}
Deadline: ${deadlineFormatted} (${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} remaining)
${job.url ? `\nJob URL: ${job.url}` : ''}

Don't forget to submit your application before the deadline!

---
Job Application Tracker
Login to manage your applications: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`

              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">⏰ Application Deadline Reminder</h2>
                  <p>Hi ${user.name || 'there'},</p>
                  <p>This is a reminder that the application deadline for the following job is approaching:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Job Title:</strong> ${job.title}</p>
                    <p style="margin: 8px 0;"><strong>Company:</strong> ${job.company}</p>
                    <p style="margin: 8px 0;"><strong>Deadline:</strong> ${deadlineFormatted}</p>
                    <p style="margin: 8px 0; color: #dc2626; font-weight: bold;">
                      ${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} remaining
                    </p>
                    ${job.url ? `<p style="margin: 8px 0;"><a href="${job.url}" style="color: #2563eb;">View Job Posting</a></p>` : ''}
                  </div>
                  <p>Don't forget to submit your application before the deadline!</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
                  <p style="font-size: 12px; color: #6b7280;">
                    Job Application Tracker<br />
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: #2563eb;">Login to manage your applications</a>
                  </p>
                </div>
              `
              
              // Send email
              await sendEmail(user.email, subject, text, html)
              
              remindersSent.push({
                jobId: job.id,
                jobTitle: job.title,
                company: job.company,
                daysUntilDeadline,
                userEmail: user.email
              })
              
              console.log(`[Reminders] ✅ Sent reminder to ${user.email} for ${job.title} at ${job.company}`)
            }
          } catch (error) {
            console.error(`[Reminders] Error processing job ${job.id}:`, error)
            errors.push({ jobId: job.id, error: error.message })
          }
        }
        
        return handleCORS(NextResponse.json({ 
          success: true,
          remindersSent: remindersSent.length,
          reminders: remindersSent,
          errors: errors.length > 0 ? errors : undefined
        }))
      } catch (error) {
        console.error('[Reminders] Error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to check reminders: ' + error.message }, { status: 500 }))
      }
    }

    // ============ DOCUMENT ROUTES ============
    
    // Refine document
    if (route === '/documents/refine' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { documentType, content, jobDescription, userPreferences, userProfile } = body
      
      if (!documentType || !jobDescription) {
        return handleCORS(NextResponse.json({ error: 'documentType and jobDescription are required' }, { status: 400 }))
      }
      
      if (!['resume', 'coverLetter', 'supportingStatement'].includes(documentType)) {
        return handleCORS(NextResponse.json({ error: 'Invalid document type' }, { status: 400 }))
      }
      
      try {
        const refinedContent = await refineDocument(documentType, content, jobDescription, userPreferences, userProfile)
        return handleCORS(NextResponse.json({ refinedContent }))
      } catch (error) {
        console.error('Refine error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to refine document' }, { status: 500 }))
      }
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
