import RegisterClient from './RegisterClient';

export const metadata = {
  title: 'Create Account – JobTracker AI',
  description:
    'Create your free JobTracker AI account to start tracking job applications, generate AI-tailored resumes and cover letters, and land your next role.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/register' },
  openGraph: {
    title: 'Create Account – JobTracker AI',
    description: 'Start tracking applications and let AI write your documents.',
    url: '/auth/register',
    type: 'website',
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
