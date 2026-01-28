import './globals.css'
import { Toaster } from 'sonner'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Job Application Tracker',
  description: 'Track your job applications with AI-powered document generation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-background flex flex-col ${inter.className}`}>
        <div className="flex-1">
          {children}
        </div>
        <footer className="flex justify-center items-center">
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors px-2">Cookies</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors px-2">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition-colors px-2">Terms</Link>
        </footer>
        <Toaster position="top-right" richColors />        
      </body>
    </html>
  )
}
