import * as cheerio from 'cheerio'

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

export function extractTextContent(html) {
  const $ = cheerio.load(html)
  
  // Remove script, style, nav, footer, header elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove()
  
  // Get main content area if exists
  let mainContent = $('main, article, [role="main"], .job-description, .job-details, #job-description, .posting-content').text()
  
  if (!mainContent || mainContent.length < 100) {
    mainContent = $('body').text()
  }
  
  // Clean up whitespace
  return mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
}

export function detectJobBoard(url) {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('linkedin.com')) return 'linkedin'
  if (urlLower.includes('indeed.com')) return 'indeed'
  if (urlLower.includes('jobs.ac.uk')) return 'jobs.ac.uk'
  if (urlLower.includes('glassdoor.com')) return 'glassdoor'
  if (urlLower.includes('monster.com')) return 'monster'
  return 'generic'
}
