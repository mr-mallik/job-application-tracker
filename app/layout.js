import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Job Application Tracker',
  description: 'Track your job applications with AI-powered document generation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
