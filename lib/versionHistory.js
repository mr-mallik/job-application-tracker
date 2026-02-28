/**
 * Document Version History Management
 * Stores versions in localStorage with timestamps
 */

const MAX_VERSIONS = 5

/**
 * Get version history key for a specific job and document type
 */
function getVersionKey(jobId, documentType) {
  return `version_history_${jobId}_${documentType}`
}

/**
 * Save a new version to history
 * @param {string} jobId - Job ID
 * @param {string} documentType - Document type (resume, coverLetter, supportingStatement)
 * @param {string} content - Document content
 */
export function saveVersion(jobId, documentType, content) {
  if (!content || content.trim().length === 0) return

  const key = getVersionKey(jobId, documentType)
  const existingVersions = getVersionHistory(jobId, documentType)

  const newVersion = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    content,
    preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
  }

  // Add new version at the beginning
  const updatedVersions = [newVersion, ...existingVersions]

  // Keep only MAX_VERSIONS
  const trimmedVersions = updatedVersions.slice(0, MAX_VERSIONS)

  try {
    localStorage.setItem(key, JSON.stringify(trimmedVersions))
  } catch (error) {
    console.error('Failed to save version history:', error)
  }
}

/**
 * Get version history for a document
 * @param {string} jobId - Job ID
 * @param {string} documentType - Document type
 * @returns {Array} Array of version objects
 */
export function getVersionHistory(jobId, documentType) {
  const key = getVersionKey(jobId, documentType)
  
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load version history:', error)
    return []
  }
}

/**
 * Delete version history for a document
 * @param {string} jobId - Job ID
 * @param {string} documentType - Document type
 */
export function clearVersionHistory(jobId, documentType) {
  const key = getVersionKey(jobId, documentType)
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear version history:', error)
  }
}

/**
 * Restore a specific version
 * @param {string} jobId - Job ID
 * @param {string} documentType - Document type
 * @param {number} versionId - Version ID (timestamp)
 * @returns {string|null} Version content or null if not found
 */
export function restoreVersion(jobId, documentType, versionId) {
  const versions = getVersionHistory(jobId, documentType)
  const version = versions.find(v => v.id === versionId)
  return version ? version.content : null
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted display string
 */
export function formatVersionTimestamp(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
