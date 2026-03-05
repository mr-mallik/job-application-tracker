import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';

export const metadata = {
  title: 'Sign In – JobTracker AI',
  description:
    'Sign in to JobTracker AI and manage your job applications, AI-generated resumes, cover letters, and interview tracking in one place.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/login' },
  openGraph: {
    title: 'Sign In – JobTracker AI',
    description: 'Access your AI-powered job application dashboard.',
    url: '/auth/login',
    type: 'website',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
