import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import {
  createUser,
  verifyUserEmail,
  loginUser,
  getUserFromToken,
  updateUserProfile,
  resetPasswordRequest,
  resetPassword,
  changePassword,
  deleteUserAccount,
  sendEmail,
} from '@/lib/auth';
import { scrapeWithPlaywright, parseWithCheerio, detectJobBoard } from '@/lib/scraper';
import { classifyJobData, refineDocumentToBlocks, analyzeKeywords } from '@/lib/gemini';
import { validateBlockArray } from '@/lib/blockSchema';

// MongoDB connection
let client;
let db;

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    db = client.db(process.env.DB_NAME || 'job_tracker');
  }
  return db;
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Helper function to parse dates (mm/yyyy format)
function parseDate(dateString) {
  if (!dateString || dateString.toLowerCase() === 'present') {
    return new Date(); // Current date for "Present"
  }
  const parts = dateString.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0]) - 1;
    const year = parseInt(parts[1]);
    return new Date(year, month);
  }
  return new Date(0); // Default to epoch if invalid
}

// Helper function to transform flat user data to nested profile structure
function transformUserData(user) {
  if (!user) return null;

  // If profile data is already nested, return as-is
  if (user.profile && typeof user.profile === 'object') {
    return user;
  }

  // Helper: Convert education from single object to array if needed
  let educationArray = user.education || [];
  if (user.education && !Array.isArray(user.education)) {
    educationArray = [user.education];
  }

  // Helper: Convert string-based skills to structured format if needed
  let skillsObject = user.skills || { technical: [], soft: [], languages: [], other: [] };
  if (user.skills && typeof user.skills === 'object') {
    // If skills are stored as strings (legacy format), convert to arrays
    if (typeof user.skills.relevant === 'string' || typeof user.skills.other === 'string') {
      const technical = user.skills.relevant
        ? user.skills.relevant
            .split(',')
            .map((s) => ({ name: s.trim(), proficiency: 'Intermediate' }))
        : [];
      const soft = user.skills.other
        ? user.skills.other.split(',').map((s) => ({ name: s.trim(), proficiency: 'Intermediate' }))
        : [];
      skillsObject = { technical, soft, languages: [], other: [] };
    }
  }

  // Transform flat structure to nested profile structure
  const transformed = {
    ...user,
    profile: {
      headline: user.designation || user.headline || '',
      phone: user.phone || '',
      location: user.location || '',
      linkedin: user.linkedin || '',
      portfolio: user.portfolio || '',
      summary: user.summary || '',
      experiences: user.experiences || [],
      education: educationArray,
      skills: skillsObject,
      projects: user.projects || [],
      interests: user.interests || [],
      achievements: user.achievements || '',
      certifications: user.certifications || [],
    },
  };

  // Clean up duplicate fields at root level (optional)
  delete transformed.designation;
  delete transformed.headline;
  delete transformed.phone;
  delete transformed.location;
  delete transformed.linkedin;
  delete transformed.portfolio;
  delete transformed.summary;
  delete transformed.experiences;
  delete transformed.education;
  delete transformed.skills;
  delete transformed.projects;
  delete transformed.interests;
  delete transformed.achievements;
  delete transformed.certifications;

  return transformed;
}

async function getAuthUser(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return getUserFromToken(token);
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

async function handleRoute(request, { params }) {
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    const db = await connectToMongo();

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Job Tracker API v1.0' }));
    }

    // ============ AUTH ROUTES ============

    // Register
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json();
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return handleCORS(
          NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 })
        );
      }

      try {
        const user = await createUser(email, password, name);
        return handleCORS(
          NextResponse.json({
            message: 'Registration successful. Check console for verification code.',
            user,
          })
        );
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }));
      }
    }

    // Verify email
    if (route === '/auth/verify' && method === 'POST') {
      const body = await request.json();
      const { email, code } = body;

      try {
        await verifyUserEmail(email, code);
        return handleCORS(NextResponse.json({ message: 'Email verified successfully' }));
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }));
      }
    }

    // Login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json();
      const { email, password } = body;

      try {
        const result = await loginUser(email, password);
        // Transform user data to nested profile structure
        const transformedUser = transformUserData(result.user);
        return handleCORS(NextResponse.json({ user: transformedUser, token: result.token }));
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 401 }));
      }
    }

    // Get current user
    if (route === '/auth/me' && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }
      const transformedUser = transformUserData(user);
      return handleCORS(NextResponse.json({ user: transformedUser }));
    }

    // Update profile
    if (route === '/auth/profile' && method === 'PUT') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();

      // Handle nested profile structure from frontend
      const updates = {};
      if (body.name) updates.name = body.name;

      if (body.profile) {
        // Map nested profile fields to flat database structure
        if (body.profile.headline !== undefined) updates.designation = body.profile.headline;
        if (body.profile.phone !== undefined) updates.phone = body.profile.phone;
        if (body.profile.location !== undefined) updates.location = body.profile.location;
        if (body.profile.linkedin !== undefined) updates.linkedin = body.profile.linkedin;
        if (body.profile.portfolio !== undefined) updates.portfolio = body.profile.portfolio;
        if (body.profile.summary !== undefined) updates.summary = body.profile.summary;
        if (body.profile.experiences !== undefined) updates.experiences = body.profile.experiences;
        if (body.profile.education !== undefined) updates.education = body.profile.education;
        if (body.profile.skills !== undefined) updates.skills = body.profile.skills;
        if (body.profile.projects !== undefined) updates.projects = body.profile.projects;
        if (body.profile.interests !== undefined) updates.interests = body.profile.interests;
        if (body.profile.achievements !== undefined)
          updates.achievements = body.profile.achievements;
        if (body.profile.certifications !== undefined)
          updates.certifications = body.profile.certifications;
      }

      const updatedUser = await updateUserProfile(user.id, updates);
      const transformedUser = transformUserData(updatedUser);
      return handleCORS(NextResponse.json({ user: transformedUser }));
    }

    // Parse resume PDF
    if (route === '/auth/parse-resume' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { base64Content } = body;

      if (!base64Content) {
        return handleCORS(
          NextResponse.json({ error: 'Resume content is required' }, { status: 400 })
        );
      }

      try {
        const { parseResumePDF } = await import('@/lib/gemini');

        const profileData = await parseResumePDF(base64Content);

        // Sort experiences and education chronologically (most recent first)
        if (profileData.experiences && profileData.experiences.length > 0) {
          profileData.experiences.sort((a, b) => {
            const dateA = parseDate(a.startDate);
            const dateB = parseDate(b.startDate);
            return dateB - dateA; // Descending order (most recent first)
          });
        }

        return handleCORS(NextResponse.json({ profileData }));
      } catch (error) {
        console.error('[API] Resume parsing error:', error);
        return handleCORS(
          NextResponse.json({ error: 'Failed to parse resume: ' + error.message }, { status: 500 })
        );
      }
    }

    // Request password reset
    if (route === '/auth/forgot-password' && method === 'POST') {
      const body = await request.json();
      const { email } = body;

      await resetPasswordRequest(email);
      return handleCORS(
        NextResponse.json({ message: 'If an account exists, reset code was sent. Check console.' })
      );
    }

    // Reset password
    if (route === '/auth/reset-password' && method === 'POST') {
      const body = await request.json();
      const { email, code, newPassword } = body;

      try {
        await resetPassword(email, code, newPassword);
        return handleCORS(NextResponse.json({ message: 'Password reset successful' }));
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }));
      }
    }

    // Change password (authenticated)
    if (route === '/auth/change-password' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return handleCORS(
          NextResponse.json(
            { error: 'Current password and new password are required' },
            { status: 400 }
          )
        );
      }

      try {
        await changePassword(user.id, currentPassword, newPassword);
        return handleCORS(NextResponse.json({ message: 'Password changed successfully' }));
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }));
      }
    }

    // Delete account (authenticated)
    if (route === '/auth/delete-account' && method === 'DELETE') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      try {
        await deleteUserAccount(user.id);
        return handleCORS(NextResponse.json({ message: 'Account deleted successfully' }));
      } catch (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }));
      }
    }

    // ============ JOB ROUTES ============

    // Scrape job from URL using Playwright + Cheerio + Gemini AI
    if (route === '/jobs/scrape' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { url } = body;

      if (!url) {
        return handleCORS(NextResponse.json({ error: 'URL is required' }, { status: 400 }));
      }

      try {
        const jobBoard = detectJobBoard(url);

        // Step 1: Use Browserless to fetch the page (handles JavaScript rendering)

        const scrapedResult = await scrapeWithPlaywright(url);
        const { html, visibleText, method } = scrapedResult;

        // Validate we have sufficient content before proceeding
        if (!html || html.length < 1000 || !visibleText || visibleText.length < 500) {
          console.error('[Scraper] Insufficient content. Likely an auth page or error.');
          return handleCORS(
            NextResponse.json(
              {
                error:
                  'Unable to extract job details. The URL may require authentication (login), be a search results page instead of a specific job posting, or the page did not load properly. Please try: 1) A direct link to a single job posting, 2) Logging in first and copying the job description text to use "Paste Text" mode instead.',
              },
              { status: 400 }
            )
          );
        }

        // Step 2: Parse with Cheerio to extract structured data

        const scrapedData = parseWithCheerio(html, url);
        scrapedData.visibleText = visibleText;

        // Validate we have meaningful data before calling Gemini
        const hasValidData =
          (scrapedData.possibleTitles.length > 0 &&
            scrapedData.possibleTitles[0] !== 'Sign in' &&
            scrapedData.possibleTitles[0].length > 5) ||
          (scrapedData.possibleDescriptions.length > 0 &&
            scrapedData.possibleDescriptions[0].length > 200) ||
          visibleText.length > 2000;

        if (!hasValidData) {
          console.error('[Scraper] No valid job data found. Skipping Gemini call.');
          return handleCORS(
            NextResponse.json(
              {
                error:
                  'No job posting found at this URL. This might be a login page, search results page, or expired listing. Try using "Paste Text" mode instead.',
              },
              { status: 400 }
            )
          );
        }

        // Step 3: Use Gemini AI to classify and structure the data

        const jobDetails = await classifyJobData(scrapedData, url);

        return handleCORS(
          NextResponse.json({
            jobDetails,
            meta: {
              jobBoard,
              scrapedAt: new Date().toISOString(),
              method: method || 'unknown',
            },
          })
        );
      } catch (error) {
        console.error('[Scraper] Error:', error);

        // Provide helpful error messages based on error type
        let userMessage = error.message;
        if (error.message.includes('authentication') || error.message.includes('Login')) {
          userMessage =
            'This page requires login. Please log in to the job site first, then copy and paste the job description using "Paste Text" mode.';
        } else if (error.message.includes('validation failed')) {
          userMessage =
            'Unable to extract job details from this page. Try using "Paste Text" mode instead.';
        }

        return handleCORS(NextResponse.json({ error: userMessage }, { status: 500 }));
      }
    }

    // Extract job details from pasted text using Gemini AI
    if (route === '/jobs/extract-text' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { text } = body;

      if (!text) {
        return handleCORS(
          NextResponse.json({ error: 'Job description text is required' }, { status: 400 })
        );
      }

      try {
        // Use Gemini AI to extract structured data from text

        const { extractJobDetailsFromText } = await import('@/lib/gemini');
        const jobDetails = await extractJobDetailsFromText(text);

        return handleCORS(
          NextResponse.json({
            jobDetails,
            meta: {
              extractedAt: new Date().toISOString(),
              source: 'text',
            },
          })
        );
      } catch (error) {
        console.error('[Text Extraction] Error:', error);
        return handleCORS(
          NextResponse.json(
            { error: 'Failed to extract job details: ' + error.message },
            { status: 500 }
          )
        );
      }
    }

    // Get all jobs for user
    if (route === '/jobs' && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const jobs = await db
        .collection('jobs')
        .aggregate([
          { $match: { userId: user.id } },
          {
            // Add a helper field: 0 = has closing date, 1 = no closing date
            // Guards against null, missing, AND empty-string closingDate values
            $addFields: {
              _hasClosingDate: {
                $cond: {
                  if: {
                    $and: [{ $ne: ['$closingDate', null] }, { $ne: ['$closingDate', ''] }],
                  },
                  then: 0,
                  else: 1,
                },
              },
            },
          },
          {
            $sort: {
              _hasClosingDate: 1, // jobs with dates (0) before jobs without (1)
              closingDate: 1, // soonest deadline first among dated jobs
              createdAt: -1, // most recently added first among undated jobs
            },
          },
        ])
        .toArray();

      // Attach linked document IDs for each job (new document collection)
      const jobIds = jobs.map((j) => j.id);
      const linkedDocs = jobIds.length
        ? await db
            .collection('documents')
            .find({ userId: user.id, jobId: { $in: jobIds } })
            .project({ id: 1, jobId: 1, type: 1, title: 1, template: 1, _id: 0 })
            .toArray()
        : [];

      // Build jobId → docs[] map
      const docsByJob = {};
      for (const doc of linkedDocs) {
        if (!docsByJob[doc.jobId]) docsByJob[doc.jobId] = [];
        docsByJob[doc.jobId].push(doc);
      }

      const cleanJobs = jobs.map(({ _id, _hasClosingDate, ...rest }) => ({
        ...rest,
        documents: docsByJob[rest.id] || [],
      }));
      return handleCORS(NextResponse.json({ jobs: cleanJobs }));
    }

    // Create job application
    if (route === '/jobs' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
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
          daysBefore: body.reminder?.daysBefore || null, // null means use system defaults (7 and 1 day)
        },
        resume: { content: '', refinedContent: '' },
        coverLetter: { content: '', refinedContent: '' },
        supportingStatement: { content: '', refinedContent: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('jobs').insertOne(job);
      const { _id, ...cleanJob } = job;
      return handleCORS(NextResponse.json({ job: cleanJob }, { status: 201 }));
    }

    // Get single job
    if (route.match(/^\/jobs\/[^/]+$/) && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const jobId = path[1];
      const job = await db.collection('jobs').findOne({ id: jobId, userId: user.id });

      if (!job) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }));
      }

      // Attach linked documents
      const linkedDocs = await db
        .collection('documents')
        .find({ userId: user.id, jobId })
        .project({ id: 1, jobId: 1, type: 1, title: 1, template: 1, updatedAt: 1, _id: 0 })
        .toArray();

      const { _id, ...cleanJob } = job;
      return handleCORS(NextResponse.json({ job: { ...cleanJob, documents: linkedDocs } }));
    }

    // Update job
    if (route.match(/^\/jobs\/[^/]+$/) && method === 'PUT') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const jobId = path[1];
      const body = await request.json();

      const updates = { updatedAt: new Date() };
      const allowedFields = [
        'title',
        'company',
        'location',
        'salary',
        'closingDate',
        'appliedDate',
        'status',
        'url',
        'description',
        'requirements',
        'benefits',
        'notes',
        'rejectionFeedback',
        'resume',
        'coverLetter',
        'supportingStatement',
        'reminder',
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }

      const result = await db
        .collection('jobs')
        .updateOne({ id: jobId, userId: user.id }, { $set: updates });

      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }));
      }

      const job = await db.collection('jobs').findOne({ id: jobId });
      const { _id, ...cleanJob } = job;
      return handleCORS(NextResponse.json({ job: cleanJob }));
    }

    // Delete job
    if (route.match(/^\/jobs\/[^/]+$/) && method === 'DELETE') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const jobId = path[1];
      const result = await db.collection('jobs').deleteOne({ id: jobId, userId: user.id });

      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }));
      }

      return handleCORS(NextResponse.json({ message: 'Job deleted' }));
    }

    // ============ REMINDER ROUTES ============

    // Check and send reminders for upcoming deadlines
    if (route === '/reminders/check' && method === 'POST') {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all jobs with reminders enabled, status is "saved", and have a closing date
        const jobs = await db
          .collection('jobs')
          .find({
            'reminder.enabled': true,
            status: 'saved',
            closingDate: { $ne: null, $exists: true },
          })
          .toArray();

        const remindersSent = [];
        const errors = [];

        for (const job of jobs) {
          try {
            // Skip if no closing date
            if (!job.closingDate) continue;

            // Parse closing date
            const closingDate = new Date(job.closingDate);
            closingDate.setHours(0, 0, 0, 0);

            // Calculate days until deadline
            const daysUntilDeadline = Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24));

            // Skip if deadline has passed
            if (daysUntilDeadline < 0) {
              continue;
            }

            // Determine if reminder should be sent
            let shouldSend = false;

            if (job.reminder.daysBefore !== null && job.reminder.daysBefore !== undefined) {
              // User has set custom reminder
              shouldSend = daysUntilDeadline === job.reminder.daysBefore;
            } else {
              // Use system defaults: 7 days and 1 day before
              shouldSend = daysUntilDeadline === 7 || daysUntilDeadline === 1;
            }

            if (shouldSend) {
              // Get user email
              const user = await db.collection('users').findOne({ id: job.userId });
              if (!user || !user.email) {
                continue;
              }

              // Format deadline date
              const deadlineFormatted = closingDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              // Compose email
              const userName = user.name || 'there';
              const subject = `Reminder: ${job.title} application deadline approaching`;
              const dayText = daysUntilDeadline === 1 ? 'day' : 'days';
              const textLines = [
                'Hi ' + userName + ',',
                '',
                'This is a reminder that the application deadline for the following job is approaching:',
                '',
                'Job Title: ' + job.title,
                'Company: ' + job.company,
                'Deadline: ' +
                  deadlineFormatted +
                  ' (' +
                  daysUntilDeadline +
                  ' ' +
                  dayText +
                  ' remaining)',
              ];

              if (job.url) {
                textLines.push('\nJob URL: ' + job.url);
              }

              textLines.push(
                '',
                "Don't forget to submit your application before the deadline!",
                '',
                '---',
                'Job Application Tracker',
                'Login to manage your applications: ' + appUrl
              );

              const text = textLines.join('\n');

              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
              const jobUrlLink = job.url
                ? `<p style="margin: 8px 0;"><a href="${job.url}" style="color: #2563eb;">View Job Posting</a></p>`
                : '';

              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Application Deadline Reminder</h2>
                  <p>Hi ${userName},</p>
                  <p>This is a reminder that the application deadline for the following job is approaching:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Job Title:</strong> ${job.title}</p>
                    <p style="margin: 8px 0;"><strong>Company:</strong> ${job.company}</p>
                    <p style="margin: 8px 0;"><strong>Deadline:</strong> ${deadlineFormatted}</p>
                    <p style="margin: 8px 0; color: #dc2626; font-weight: bold;">
                      ${daysUntilDeadline} ${dayText} remaining
                    </p>
                    ${jobUrlLink}
                  </div>
                  <p>Don't forget to submit your application before the deadline!</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
                  <p style="font-size: 12px; color: #6b7280;">
                    Job Application Tracker<br />
                    <a href="${appUrl}" style="color: #2563eb;">Login to manage your applications</a>
                  </p>
                </div>
              `;

              // Send email
              await sendEmail(user.email, subject, text, html);

              remindersSent.push({
                jobId: job.id,
                jobTitle: job.title,
                company: job.company,
                daysUntilDeadline,
                userEmail: user.email,
              });
            }
          } catch (error) {
            console.error(`[Reminders] Error processing job ${job.id}:`, error);
            errors.push({ jobId: job.id, error: error.message });
          }
        }

        return handleCORS(
          NextResponse.json({
            success: true,
            remindersSent: remindersSent.length,
            reminders: remindersSent,
            errors: errors.length > 0 ? errors : undefined,
          })
        );
      } catch (error) {
        console.error('[Reminders] Error:', error);
        return handleCORS(
          NextResponse.json(
            { error: 'Failed to check reminders: ' + error.message },
            { status: 500 }
          )
        );
      }
    }

    // ============ DOCUMENT ROUTES ============

    // Refine document → blocks (new block-based editor)
    if (route === '/documents/refine-blocks' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { documentType, content, jobDescription, userPreferences, userProfile } = body;

      if (!documentType || !jobDescription) {
        return handleCORS(
          NextResponse.json(
            { error: 'documentType and jobDescription are required' },
            { status: 400 }
          )
        );
      }

      if (!['resume', 'coverLetter', 'supportingStatement'].includes(documentType)) {
        return handleCORS(NextResponse.json({ error: 'Invalid document type' }, { status: 400 }));
      }

      try {
        const blocks = await refineDocumentToBlocks(
          documentType,
          content,
          jobDescription,
          userPreferences,
          userProfile
        );
        return handleCORS(NextResponse.json({ blocks }));
      } catch (error) {
        console.error('Refine-blocks error:', error);
        return handleCORS(
          NextResponse.json({ error: 'Failed to refine document to blocks' }, { status: 500 })
        );
      }
    }

    // Keyword analysis — reads cache from job doc, refreshes on demand
    if (route === '/documents/analyze-keywords' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { jobId, resumeText, force = false } = body;

      if (!jobId || !resumeText) {
        return handleCORS(
          NextResponse.json({ error: 'jobId and resumeText are required' }, { status: 400 })
        );
      }

      const job = await db.collection('jobs').findOne({ id: jobId, userId: user.id });
      if (!job) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }));
      }

      // Return cached result unless force-refresh requested
      if (!force && job.keywordAnalysis) {
        return handleCORS(NextResponse.json({ analysis: job.keywordAnalysis, cached: true }));
      }

      const jobDescription = [job.description, job.requirements].filter(Boolean).join('\n\n');
      if (!jobDescription.trim()) {
        return handleCORS(
          NextResponse.json(
            { error: 'Job has no description or requirements to analyse' },
            { status: 422 }
          )
        );
      }

      try {
        const analysis = await analyzeKeywords(resumeText, jobDescription);
        analysis.analysedAt = new Date().toISOString();
        analysis.keywordsPresent = analysis.keywords.filter((k) => k.present).map((k) => k.keyword);
        analysis.keywordsMissing = analysis.keywords
          .filter((k) => !k.present)
          .map((k) => k.keyword);

        await db
          .collection('jobs')
          .updateOne(
            { id: jobId, userId: user.id },
            { $set: { keywordAnalysis: analysis, updatedAt: new Date() } }
          );

        return handleCORS(NextResponse.json({ analysis, cached: false }));
      } catch (error) {
        console.error('Keyword analysis error:', error);
        return handleCORS(NextResponse.json({ error: 'Keyword analysis failed' }, { status: 500 }));
      }
    }

    // Lightweight keyword presence update — no AI, DB write only
    if (route === '/documents/update-keyword-presence' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }
      const body = await request.json();
      const { jobId, keywordAnalysis } = body;
      if (!jobId || !keywordAnalysis) {
        return handleCORS(
          NextResponse.json({ error: 'jobId and keywordAnalysis are required' }, { status: 400 })
        );
      }
      await db
        .collection('jobs')
        .updateOne(
          { id: jobId, userId: user.id },
          { $set: { keywordAnalysis, updatedAt: new Date() } }
        );
      return handleCORS(NextResponse.json({ ok: true }));
    }

    // Refine a single block's text (per-paragraph AI)
    if (route === '/documents/refine-block' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { text, instructions, jobDescription } = body;

      if (!text) {
        return handleCORS(NextResponse.json({ error: 'text is required' }, { status: 400 }));
      }

      const prompt = `You are a professional resume/cover letter editor. Refine the following paragraph.

CURRENT TEXT:
${text}

${instructions ? `INSTRUCTIONS: ${instructions}\n` : ''}${jobDescription ? `JOB CONTEXT:\n${jobDescription}\n` : ''}
RULES:
- Only rephrase/improve what is already there — do NOT invent new facts or experience
- Return ONLY the refined paragraph text, no headings, no quotes, no explanation
- Keep it concise`;

      try {
        const { generateWithFallback } = await import('@/lib/gemini');
        const refinedText = await generateWithFallback(prompt);
        return handleCORS(NextResponse.json({ refinedText: refinedText.trim() }));
      } catch (error) {
        console.error('Refine-block error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to refine block' }, { status: 500 }));
      }
    }

    // ============ DOCUMENT ROUTES ============

    // List all documents for current user
    if (route === '/documents' && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const url = new URL(request.url);
      const jobId = url.searchParams.get('jobId');
      const type = url.searchParams.get('type');

      const query = { userId: user.id };
      if (jobId) query.jobId = jobId;
      if (type) query.type = type;

      const docs = await db
        .collection('documents')
        .find(query)
        .sort({ updatedAt: -1 })
        .project({ versions: 0 }) // omit bulk version history from list view
        .toArray();

      const cleanDocs = docs.map(({ _id, ...rest }) => rest);
      return handleCORS(NextResponse.json({ documents: cleanDocs }));
    }

    // Create document
    if (route === '/documents' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { type, title, template, blocks, jobId } = body;

      if (!type || !title) {
        return handleCORS(
          NextResponse.json({ error: 'type and title are required' }, { status: 400 })
        );
      }

      if (blocks && blocks.length > 0) {
        const validation = validateBlockArray(blocks);
        if (!validation.valid) {
          return handleCORS(
            NextResponse.json(
              { error: 'Invalid blocks', details: validation.errors },
              { status: 400 }
            )
          );
        }
      }

      const doc = {
        id: uuidv4(),
        userId: user.id,
        jobId: jobId || null,
        type,
        title,
        template: template || (type === 'resume' ? 'ats' : 'formal'),
        blocks: blocks || [],
        schemaVersion: 1,
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('documents').insertOne(doc);
      const { _id, ...cleanDoc } = doc;
      return handleCORS(NextResponse.json({ document: cleanDoc }, { status: 201 }));
    }

    // List documents by jobId
    if (route.match(/^\/documents\/job\/[^/]+$/) && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const jobId = path[2];
      const docs = await db
        .collection('documents')
        .find({ userId: user.id, jobId })
        .sort({ updatedAt: -1 })
        .project({ versions: 0 })
        .toArray();

      const cleanDocs = docs.map(({ _id, ...rest }) => rest);
      return handleCORS(NextResponse.json({ documents: cleanDocs }));
    }

    // Get single document
    if (route.match(/^\/documents\/[^/]+$/) && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const docId = path[1];
      const doc = await db.collection('documents').findOne({ id: docId, userId: user.id });

      if (!doc) {
        return handleCORS(NextResponse.json({ error: 'Document not found' }, { status: 404 }));
      }

      const { _id, ...cleanDoc } = doc;
      return handleCORS(NextResponse.json({ document: cleanDoc }));
    }

    // Update document
    if (route.match(/^\/documents\/[^/]+$/) && method === 'PUT') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const docId = path[1];
      const body = await request.json();

      // Validate blocks if provided
      if (body.blocks && body.blocks.length > 0) {
        const validation = validateBlockArray(body.blocks);
        if (!validation.valid) {
          return handleCORS(
            NextResponse.json(
              { error: 'Invalid blocks', details: validation.errors },
              { status: 400 }
            )
          );
        }
      }

      // Fetch current doc to snapshot version
      const current = await db.collection('documents').findOne({ id: docId, userId: user.id });
      if (!current) {
        return handleCORS(NextResponse.json({ error: 'Document not found' }, { status: 404 }));
      }

      const snapshot = {
        blocks: current.blocks,
        template: current.template,
        title: current.title,
        savedAt: current.updatedAt,
      };

      const updates = { updatedAt: new Date() };
      const allowedFields = ['title', 'template', 'blocks', 'jobId'];
      for (const field of allowedFields) {
        if (body[field] !== undefined) updates[field] = body[field];
      }

      await db.collection('documents').updateOne(
        { id: docId, userId: user.id },
        {
          $set: updates,
          $push: { versions: { $each: [snapshot], $slice: -50 } }, // keep last 50 versions
        }
      );

      const updated = await db
        .collection('documents')
        .findOne({ id: docId }, { projection: { _id: 0 } });
      return handleCORS(NextResponse.json({ document: updated }));
    }

    // Delete document
    if (route.match(/^\/documents\/[^/]+$/) && method === 'DELETE') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const docId = path[1];
      const result = await db.collection('documents').deleteOne({ id: docId, userId: user.id });

      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json({ error: 'Document not found' }, { status: 404 }));
      }

      return handleCORS(NextResponse.json({ message: 'Document deleted' }));
    }

    // Get document version history
    if (route.match(/^\/documents\/[^/]+\/versions$/) && method === 'GET') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const docId = path[1];
      const doc = await db
        .collection('documents')
        .findOne({ id: docId, userId: user.id }, { projection: { versions: 1, _id: 0 } });

      if (!doc) {
        return handleCORS(NextResponse.json({ error: 'Document not found' }, { status: 404 }));
      }

      // Return in reverse chronological order
      const versions = (doc.versions || []).slice().reverse();
      return handleCORS(NextResponse.json({ versions }));
    }

    // Migrate legacy embedded document (job.resume / coverLetter / supportingStatement) → documents collection
    if (route === '/documents/migrate-job' && method === 'POST') {
      const user = await getAuthUser(request);
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const body = await request.json();
      const { jobId, documentType } = body;

      if (!jobId || !documentType) {
        return handleCORS(
          NextResponse.json({ error: 'jobId and documentType are required' }, { status: 400 })
        );
      }

      const job = await db.collection('jobs').findOne({ id: jobId, userId: user.id });
      if (!job) {
        return handleCORS(NextResponse.json({ error: 'Job not found' }, { status: 404 }));
      }

      // Check if a document of this type already exists for the job
      const existing = await db
        .collection('documents')
        .findOne({ userId: user.id, jobId, type: documentType });
      if (existing) {
        const { _id, ...clean } = existing;
        return handleCORS(NextResponse.json({ document: clean, alreadyExists: true }));
      }

      const blocks = [];

      const templateMap = { resume: 'ats', coverLetter: 'formal', supportingStatement: 'formal' };
      const titleMap = {
        resume: 'Resume',
        coverLetter: 'Cover Letter',
        supportingStatement: 'Supporting Statement',
      };

      const doc = {
        id: uuidv4(),
        userId: user.id,
        jobId,
        type: documentType,
        title: `${titleMap[documentType] || documentType} — ${job.title || ''}`.trim(),
        template: templateMap[documentType] || 'ats',
        blocks,
        schemaVersion: 1,
        versions: [],
        migratedFromLegacy: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('documents').insertOne(doc);
      const { _id, ...cleanDoc } = doc;
      return handleCORS(NextResponse.json({ document: cleanDoc }, { status: 201 }));
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }));
  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}

export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
