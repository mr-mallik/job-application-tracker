import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createUser, verifyUserEmail, loginUser, getUserFromToken, updateUserProfile, resetPasswordRequest, resetPassword } from '@/lib/auth'
import { fetchPageContent, extractTextContent } from '@/lib/scraper'
import { extractJobDetailsFromHTML, refineDocument } from '@/lib/gemini'
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

    // ============ JOB ROUTES ============
    
    // Scrape job from URL
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
        const html = await fetchPageContent(url)
        const textContent = extractTextContent(html)
        const jobDetails = await extractJobDetailsFromHTML(url, textContent)
        
        return handleCORS(NextResponse.json({ jobDetails }))
      } catch (error) {
        console.error('Scrape error:', error)
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
        .sort({ createdAt: -1 })
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
      const allowedFields = ['title', 'company', 'location', 'salary', 'closingDate', 'appliedDate', 'status', 'url', 'description', 'requirements', 'benefits', 'notes', 'rejectionFeedback', 'resume', 'coverLetter', 'supportingStatement']
      
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

    // ============ DOCUMENT ROUTES ============
    
    // Refine document
    if (route === '/documents/refine' && method === 'POST') {
      const user = await getAuthUser(request)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { documentType, content, jobDescription, userPreferences } = body
      
      if (!documentType || !content || !jobDescription) {
        return handleCORS(NextResponse.json({ error: 'documentType, content, and jobDescription are required' }, { status: 400 }))
      }
      
      if (!['resume', 'coverLetter', 'supportingStatement'].includes(documentType)) {
        return handleCORS(NextResponse.json({ error: 'Invalid document type' }, { status: 400 }))
      }
      
      try {
        const refinedContent = await refineDocument(documentType, content, jobDescription, userPreferences)
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
