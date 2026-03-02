import './globals.css';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Job Application Tracker',
  description: 'Track your job applications with AI-powered document generation',
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
          <footer className="flex justify-center items-center py-4 border-t bg-card/50 backdrop-blur-sm">
            <Link
              href="/legal/cookies"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3"
            >
              Cookies
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/legal/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3"
            >
              Privacy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/legal/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3"
            >
              Terms
            </Link>
          </footer>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
