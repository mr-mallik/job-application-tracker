import './globals.css';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobtracker.ai';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'JobTracker AI – AI-Powered Job Application Tracker',
    template: '%s – JobTracker AI',
  },
  description:
    'Track every job application, generate tailored AI resumes, cover letters and supporting statements in seconds. Land your next role faster with JobTracker AI.',
  applicationName: 'JobTracker AI',
  authors: [{ name: 'JobTracker AI' }],
  creator: 'JobTracker AI',
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'JobTracker AI',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-background flex flex-col ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex-1">{children}</div>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
