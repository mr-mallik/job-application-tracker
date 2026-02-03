/**
 * Resume template configuration
 * Client-safe template metadata (no Node.js modules)
 */

// Template configurations
export const RESUME_TEMPLATES = {
  harvard: {
    id: 'harvard',
    name: 'Harvard Professional',
    description: 'Classic two-column design inspired by Harvard Business School',
    path: 'templates/resume/harvard.html',
    features: ['ATS-Friendly', 'Traditional', 'Academic']
  },
  '2columns': {
    id: '2columns',
    name: 'Modern Two Column',
    description: 'Modern two-column layout with left sidebar for achievements and skills',
    path: 'templates/resume/2columns.html',
    features: ['Modern', 'Visual', 'Tech Industry']
  }
  // Future templates can be added here
}
