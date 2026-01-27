import * as cheerio from 'cheerio'
import { chromium } from 'playwright'

// Scrape page using Playwright for dynamic content
export async function scrapeWithPlaywright(url) {
  let browser = null
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    })
    
    const page = await context.newPage()
    
    // Navigate with longer timeout for slow job sites
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
    
    // Wait for content to load (some sites use lazy loading)
    await page.waitForTimeout(2000)
    
    // Try to expand "Show more" buttons on job sites
    try {
      const showMoreButtons = await page.$$('button:has-text("Show more"), button:has-text("See more"), [aria-label*="Show more"]')
      for (const button of showMoreButtons.slice(0, 3)) {
        await button.click().catch(() => {})
        await page.waitForTimeout(500)
      }
    } catch (e) {
      // Ignore if no buttons found
    }
    
    // Get the full HTML
    const html = await page.content()
    
    // Also get visible text for better extraction
    const visibleText = await page.evaluate(() => {
      // Remove script, style, nav, footer elements
      const clone = document.body.cloneNode(true)
      const toRemove = clone.querySelectorAll('script, style, nav, footer, header, aside, iframe, noscript, [role="navigation"], [role="banner"]')
      toRemove.forEach(el => el.remove())
      return clone.innerText
    })
    
    await browser.close()
    
    return { html, visibleText }
  } catch (error) {
    if (browser) await browser.close()
    console.error('Playwright scraping error:', error)
    throw new Error(`Failed to scrape page: ${error.message}`)
  }
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
    
    extractedData.possibleCompanies.push($('.job-company').text().trim())
    extractedData.possibleCompanies.push($('.employer-name').text().trim())
    
    extractedData.possibleLocations.push($('.job-location').text().trim())
    
    extractedData.possibleSalaries.push($('.job-salary').text().trim())
    extractedData.possibleSalaries.push($('.salary').text().trim())
    
    extractedData.possibleDescriptions.push($('.job-description').text().trim())
    extractedData.possibleDescriptions.push($('#job-description').text().trim())
    
    extractedData.possibleDates.push($('.closing-date').text().trim())
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
