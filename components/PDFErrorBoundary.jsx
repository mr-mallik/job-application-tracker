'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

class PDFErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // Handle undefined errors thrown by react-pdf
    const safeError = error || new Error('Unknown PDF rendering error')
    return { hasError: true, error: safeError }
  }

  componentDidCatch(error, errorInfo) {
    console.error('PDF Rendering Error:', error || 'undefined error', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>PDF Rendering Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">Unable to generate PDF preview. This might be due to:</p>
              <ul className="list-disc list-inside text-sm space-y-1 mb-3">
                <li>Invalid markdown formatting</li>
                <li>Special characters causing issues</li>
                <li>Content exceeding page limits</li>
              </ul>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}

export default PDFErrorBoundary
