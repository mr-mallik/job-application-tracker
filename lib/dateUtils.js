/**
 * Date utility functions for consistent date formatting across the app
 */

/**
 * Format a date string to a readable format (e.g., "Feb 28, 2026")
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date or empty string if invalid
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Format a date string to a short format (e.g., "Feb 28")
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date or empty string if invalid
 */
export function formatDateShort(dateString) {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Check if a date is in the past
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(dateString) {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  } catch {
    return false
  }
}

/**
 * Calculate days until a date
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @returns {number} Days until date (negative if past)
 */
export function daysUntil(dateString) {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    const diffTime = date - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return null
  }
}
