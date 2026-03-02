import * as cheerio from 'cheerio'

// Normalize LinkedIn URLs to simpler format for better scraping
function normalizeLinkedInUrl(url) {
  try {
    const urlObj = new URL(url)
    
    // Check if it's a LinkedIn collections URL with currentJobId parameter
    if (urlObj.hostname.includes('linkedin.com') && 
        urlObj.pathname.includes('/jobs/collections/') && 
        urlObj.searchParams.has('currentJobId')) {
      
      const currentJobId = urlObj.searchParams.get('currentJobId')
      
      // Reconstruct URL: /jobs/view/{jobId}
      const normalizedUrl = `https://www.linkedin.com/jobs/view/${currentJobId}`
      
      
      
      
      
      return normalizedUrl
    }
    
    // Return original URL if not a LinkedIn collection URL
    return url
  } catch (error) {
    console.warn('[LinkedIn] URL normalization failed:', error.message)
    return url // Return original on error
  }
}

// Scrape using BrowserQL (GraphQL API) for advanced stealth and bot bypass
async function scrapeWithBrowserQL(url, apiKey) {
  
  
  // BrowserQL uses the base Browserless endpoint with GraphQL query
  const browserqlUrl = `https://production-sfo.browserless.io?token=${apiKey}&launch={"stealth":true}`
  
  // BrowserQL GraphQL mutation for stealth navigation and extraction
  const query = `
    mutation ScrapeJob($url: String!) {
      goto(url: $url, waitUntil: networkIdle) {
        status
      }
      
      # Wait for content to load
      wait(timeout: 3000) {
        success
      }
      
      # Try to click "Show more" buttons
      clickShowMore: click(selector: "button:has-text('Show more'), button:has-text('See more'), [aria-label*='Show more']", optional: true) {
        success
      }
      
      # Wait after clicking
      waitAfterClick: wait(timeout: 2000) {
        success
      }
      
      # Extract job title
      title: extract(selector: "h1, [class*='title'], [class*='Title']") {
        text
      }
      
      # Extract company
      company: extract(selector: "[class*='company'], [class*='Company'], [class*='employer']") {
        text
      }
      
      # Extract location
      location: extract(selector: "[class*='location'], [class*='Location']") {
        text
      }
      
      # Extract description
      description: extract(selector: "[class*='description'], [class*='Description'], main, article") {
        text
      }
      
      # Extract all text content
      fullContent: extract(selector: "body") {
        text
      }
      
      # Get HTML
      html: content {
        html
      }
    }
  `
  
  const response = await fetch(browserqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      query,
      variables: { url }
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[BrowserQL] API error:', errorText)
    throw new Error(`BrowserQL API error: ${response.status}`)
  }
  
  const result = await response.json()
  
  if (result.errors) {
    console.error('[BrowserQL] GraphQL errors:', result.errors)
    throw new Error(`BrowserQL GraphQL error: ${result.errors[0]?.message}`)
  }
  
  const data = result.data
  
  
  
  // Extract HTML and text from BrowserQL response
  const html = data.html?.html || ''
  const visibleText = data.fullContent?.text || ''
  
  
  
  
  // Build structured data from BrowserQL extraction
  const structuredData = {
    title: data.title?.text || null,
    company: data.company?.text || null,
    location: data.location?.text || null,
    description: data.description?.text || null
  }
  
  )
  
  return { html, visibleText, structuredData, method: 'browserql' }
}

// Validate if content looks like a job posting (not a login/error page)
function validateJobContent(html, visibleText) {
  const textLower = visibleText.toLowerCase()
  const htmlLower = html.toLowerCase()
  
  // Check for login/authentication indicators
  const authIndicators = [
    'sign in', 'log in', 'login', 'signin',
    'password', 'forgot password',
    'create account', 'register',
    'verify you are human', 'captcha',
    'access denied', 'unauthorized'
  ]
  
  const hasAuthIndicators = authIndicators.some(indicator => {
    const count = (textLower.match(new RegExp(indicator, 'g')) || []).length
    return count >= 2 // Multiple occurrences suggest it's an auth page
  })
  
  if (hasAuthIndicators && visibleText.length < 1000) {
    return {
      valid: false,
      reason: 'Login or authentication page detected. URL may require authentication or is not a direct job posting link.'
    }
  }
  
  // Check for job posting indicators
  const jobIndicators = [
    'job description', 'responsibilities', 'requirements',
    'qualifications', 'experience', 'skills',
    'salary', 'benefits', 'apply', 'position',
    'role', 'duties', 'about the role'
  ]
  
  const jobIndicatorCount = jobIndicators.filter(indicator => 
    textLower.includes(indicator) || htmlLower.includes(indicator)
  ).length
  
  // Need at least 3 job-related terms
  if (jobIndicatorCount < 3) {
    return {
      valid: false,
      reason: 'Content does not appear to be a job posting. Found insufficient job-related terms.'
    }
  }
  
  // Check minimum content length
  if (visibleText.length < 500) {
    return {
      valid: false,
      reason: `Insufficient content (${visibleText.length} chars). Page may not have loaded properly or requires authentication.`
    }
  }
  
  return { valid: true }
}

// Detect if URL requires advanced stealth (BrowserQL)
function requiresAdvancedStealth(url) {
  const urlLower = url.toLowerCase()
  const stealthSites = [
    'linkedin.com',
    'glassdoor.com',
    'indeed.com/company', // Company pages often have more protection
    'facebook.com/jobs',
    'twitter.com/jobs',
    'workday.com'
  ]
  
  return stealthSites.some(site => urlLower.includes(site))
}

// Scrape page using Browserless (tries BrowserQL for protected sites, falls back to REST API)
export async function scrapeWithPlaywright(url) {
  const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY
  
  if (!BROWSERLESS_API_KEY) {
    throw new Error('BROWSERLESS_API_KEY not configured')
  }
  
  // Normalize LinkedIn URLs before scraping
  url = normalizeLinkedInUrl(url)
  
  // Try BrowserQL first for protected sites (LinkedIn, etc.)
  if (requiresAdvancedStealth(url)) {
    
    try {
      const result = await scrapeWithBrowserQL(url, BROWSERLESS_API_KEY)
      
      // Validate BrowserQL result
      const validation = validateJobContent(result.html, result.visibleText)
      if (validation.valid) {
        
        return result
      } else {
        console.warn('[BrowserQL] Validation failed:', validation.reason)
        
      }
    } catch (error) {
      console.warn('[BrowserQL] Failed:', error.message)
      
    }
  }
  
  try {
    ...')
    
    // Use Browserless /scrape endpoint for intelligent content extraction
    const browserlessUrl = `https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`
    
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        url: url,
        // Extract common job posting elements
        elements: [
          { selector: 'h1, [class*="title"], [class*="Title"]' },
          { selector: '[class*="company"], [class*="Company"]' },
          { selector: '[class*="location"], [class*="Location"]' },
          { selector: '[class*="salary"], [class*="Salary"]' },
          { selector: '[class*="description"], [class*="Description"]' },
          { selector: 'main, article, [role="main"]' }
        ],
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000
        },
        waitForTimeout: 3000, // Extra wait for dynamic content
        // Click "Show more" buttons before extracting
        addScriptTag: [{
          content: `
            setTimeout(() => {
              // Click expand buttons
              const expandButtons = document.querySelectorAll('button, [role="button"], a');
              expandButtons.forEach(btn => {
                const text = (btn.textContent || btn.innerText || '').toLowerCase();
                if (text.includes('show more') || text.includes('see more') || 
                    text.includes('expand') || text.includes('read more')) {
                  try { 
                    btn.click(); 
                    );
                  } catch(e) {}
                }
              });
            }, 1500);
          `
        }]
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Browserless] API error response:', errorText)
      
      // Fallback to /content endpoint if /scrape fails
      
      return await scrapeWithContentEndpoint(url, BROWSERLESS_API_KEY)
    }
    
    const data = await response.json()
    )
    
    // Browserless /scrape returns structured data, but we need raw HTML too
    // So we'll make a second call to /content for full HTML
    const htmlResponse = await fetch(
      `https://production-sfo.browserless.io/content?token=${BROWSERLESS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 },
          waitForTimeout: 3000
        })
      }
    )
    
    const html = await htmlResponse.text()
    
    
    // Extract visible text from HTML
    const $ = cheerio.load(html)
    $('script, style, nav, footer, header, aside, iframe, noscript, [role="navigation"], [role="banner"]').remove()
    const visibleText = $('body').text()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
    
    
    
    // Validate content before returning
    const validation = validateJobContent(html, visibleText)
    if (!validation.valid) {
      console.warn('[Browserless] Content validation failed:', validation.reason)
      throw new Error(validation.reason)
    }
    
    
    return { html, visibleText, structuredData: data, method: 'rest-api' }
    
  } catch (error) {
    console.error('[Browserless] Scraping error:', error.message)
    
    // If REST API fails and we haven't tried BrowserQL, suggest it
    if (requiresAdvancedStealth(url) && !error.message.includes('BrowserQL')) {
      throw new Error(`Failed to scrape protected site. This site may require login or have bot detection. Try using "Paste Text" mode instead. (${error.message})`)
    }
    
    throw new Error(`Failed to scrape page: ${error.message}`)
  }
}

// Fallback function using /content endpoint
async function scrapeWithContentEndpoint(url, apiKey) {
  
  
  const response = await fetch(
    `https://production-sfo.browserless.io/content?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 },
        waitForTimeout: 3000,
        addScriptTag: [{
          content: `
            setTimeout(() => {
              const buttons = document.querySelectorAll('button');
              buttons.forEach(btn => {
                const text = btn.textContent.toLowerCase();
                if (text.includes('show more') || text.includes('see more') || text.includes('expand')) {
                  try { btn.click(); } catch(e) {}
                }
              });
            }, 1500);
          `
        }]
      })
    }
  )
  
  if (!response.ok) {
    throw new Error(`Browserless /content API error: ${response.status}`)
  }
  
  const html = await response.text()
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header, aside, iframe, noscript, [role="navigation"], [role="banner"]').remove()
  const visibleText = $('body').text().replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim()
  
  // Validate before returning
  const validation = validateJobContent(html, visibleText)
  if (!validation.valid) {
    throw new Error(validation.reason)
  }
  
  return { html, visibleText }
}

// Parse HTML with Cheerio to extract structured data
export function parseWithCheerio(html, url) {
  const $ = cheerio.load(html)
  
  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove()
  
  // Extract potential job-related content based on common selectors
  const extractedData = {
    // Common job title selectors
    possibleTitles: [],
    // Company name selectors
    possibleCompanies: [],
    // Location selectors
    possibleLocations: [],
    // Salary selectors
    possibleSalaries: [],
    // Description content
    possibleDescriptions: [],
    // Dates
    possibleDates: [],
    // Raw text
    rawText: ''
  }
  
  // LinkedIn selectors
  if (url.includes('linkedin.com')) {
    extractedData.possibleTitles.push($('.job-details-jobs-unified-top-card__job-title').text().trim())
    extractedData.possibleTitles.push($('.jobs-unified-top-card__job-title').text().trim())
    extractedData.possibleTitles.push($('h1').first().text().trim())
    
    extractedData.possibleCompanies.push($('.job-details-jobs-unified-top-card__company-name').text().trim())
    extractedData.possibleCompanies.push($('.jobs-unified-top-card__company-name').text().trim())
    
    extractedData.possibleLocations.push($('.job-details-jobs-unified-top-card__bullet').first().text().trim())
    extractedData.possibleLocations.push($('.jobs-unified-top-card__workplace-type').text().trim())
    
    extractedData.possibleDescriptions.push($('.jobs-description__content').text().trim())
    extractedData.possibleDescriptions.push($('.jobs-box__html-content').text().trim())
  }
  
  // Indeed selectors
  if (url.includes('indeed.com')) {
    extractedData.possibleTitles.push($('.jobsearch-JobInfoHeader-title').text().trim())
    extractedData.possibleTitles.push($('[data-testid="jobsearch-JobInfoHeader-title"]').text().trim())
    
    extractedData.possibleCompanies.push($('.jobsearch-InlineCompanyRating-companyName').text().trim())
    extractedData.possibleCompanies.push($('[data-testid="inlineHeader-companyName"]').text().trim())
    
    extractedData.possibleLocations.push($('.jobsearch-JobInfoHeader-subtitle').find('div').eq(1).text().trim())
    
    extractedData.possibleSalaries.push($('#salaryInfoAndJobType').text().trim())
    extractedData.possibleSalaries.push($('.salary-snippet-container').text().trim())
    
    extractedData.possibleDescriptions.push($('#jobDescriptionText').text().trim())
  }
  
  // jobs.ac.uk selectors
  if (url.includes('jobs.ac.uk')) {
    extractedData.possibleTitles.push($('h1.job-title').text().trim())
    extractedData.possibleTitles.push($('.job-header h1').text().trim())
    extractedData.possibleTitles.push($('h1[class*="job"]').text().trim())
    extractedData.possibleTitles.push($('.j-p-j-r-title h1').text().trim())
    extractedData.possibleTitles.push($('[data-test="job-title"]').text().trim())
    
    extractedData.possibleCompanies.push($('.job-company').text().trim())
    extractedData.possibleCompanies.push($('.employer-name').text().trim())
    extractedData.possibleCompanies.push($('[data-test="employer-name"]').text().trim())
    extractedData.possibleCompanies.push($('.j-p-j-r-employer').text().trim())
    extractedData.possibleCompanies.push($('a[href*="/employer/"]').first().text().trim())
    
    extractedData.possibleLocations.push($('.job-location').text().trim())
    extractedData.possibleLocations.push($('[data-test="location"]').text().trim())
    extractedData.possibleLocations.push($('.j-p-j-r-location').text().trim())
    
    extractedData.possibleSalaries.push($('.job-salary').text().trim())
    extractedData.possibleSalaries.push($('.salary').text().trim())
    extractedData.possibleSalaries.push($('[data-test="salary"]').text().trim())
    extractedData.possibleSalaries.push($('.j-p-j-r-salary').text().trim())
    
    extractedData.possibleDescriptions.push($('.job-description').text().trim())
    extractedData.possibleDescriptions.push($('#job-description').text().trim())
    extractedData.possibleDescriptions.push($('.j-p-j-r-description').text().trim())
    extractedData.possibleDescriptions.push($('[data-test="job-description"]').text().trim())
    
    extractedData.possibleDates.push($('.closing-date').text().trim())
    extractedData.possibleDates.push($('[data-test="closing-date"]').text().trim())
    extractedData.possibleDates.push($('.j-p-j-r-closing-date').text().trim())
  }
  
  // Generic selectors for any job site
  // Titles - usually in h1 or specific classes
  $('h1, [class*="title"], [class*="Title"], [data-testid*="title"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 200) extractedData.possibleTitles.push(text)
  })
  
  // Companies - look for company indicators
  $('[class*="company"], [class*="Company"], [class*="employer"], [class*="Employer"], [class*="organisation"], [class*="organization"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 200) extractedData.possibleCompanies.push(text)
  })
  
  // Locations
  $('[class*="location"], [class*="Location"], [class*="place"], [class*="address"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 200) extractedData.possibleLocations.push(text)
  })
  
  // Salaries - look for currency symbols and salary keywords
  $('[class*="salary"], [class*="Salary"], [class*="pay"], [class*="compensation"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 200) extractedData.possibleSalaries.push(text)
  })
  
  // Also search for salary patterns in text
  const salaryPatterns = /(?:£|€|\$|USD|GBP|EUR)\s*[\d,]+(?:\s*-\s*(?:£|€|\$|USD|GBP|EUR)?\s*[\d,]+)?(?:\s*(?:per|\/|p\.?a\.?|annually|yearly|monthly|hourly|pa|k))?/gi
  const bodyText = $('body').text()
  const salaryMatches = bodyText.match(salaryPatterns)
  if (salaryMatches) {
    extractedData.possibleSalaries.push(...salaryMatches)
  }
  
  // Descriptions - main content areas
  $('[class*="description"], [class*="Description"], [class*="details"], [class*="content"], article, main, [role="main"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length > 100) extractedData.possibleDescriptions.push(text)
  })
  
  // Dates - closing dates, deadlines
  $('[class*="date"], [class*="Date"], [class*="deadline"], [class*="closing"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 100) extractedData.possibleDates.push(text)
  })
  
  // Get clean body text
  extractedData.rawText = $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, 50000) // Limit size
  
  // Filter out empty values and duplicates
  Object.keys(extractedData).forEach(key => {
    if (Array.isArray(extractedData[key])) {
      extractedData[key] = [...new Set(extractedData[key].filter(v => v && v.length > 0))]
    }
  })
  
  return extractedData
}

// Detect job board type
export function detectJobBoard(url) {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('linkedin.com')) return 'linkedin'
  if (urlLower.includes('indeed.com')) return 'indeed'
  if (urlLower.includes('jobs.ac.uk')) return 'jobs.ac.uk'
  if (urlLower.includes('glassdoor.com')) return 'glassdoor'
  if (urlLower.includes('monster.com')) return 'monster'
  if (urlLower.includes('reed.co.uk')) return 'reed'
  if (urlLower.includes('totaljobs.com')) return 'totaljobs'
  if (urlLower.includes('cv-library.co.uk')) return 'cv-library'
  return 'generic'
}

// Legacy fetch function as fallback
export async function fetchPageContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }
    
    return await response.text()
  } catch (error) {
    console.error('Fetch error:', error)
    throw new Error('Failed to fetch job page')
  }
}
