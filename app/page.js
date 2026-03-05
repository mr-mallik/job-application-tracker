import LandingPage from './LandingPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobtracker.ai';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'JobTracker AI – AI-Powered Job Application Tracker',
  description:
    'Track every job application, generate tailored AI resumes, cover letters and supporting statements in seconds. Land your next role faster with JobTracker AI.',
  keywords: [
    'job application tracker',
    'AI resume builder',
    'AI cover letter generator',
    'job search organiser',
    'supporting statement AI',
    'job tracker app',
    'career management tool',
    'ATS resume builder',
    'job application management',
  ],
  authors: [{ name: 'JobTracker AI' }],
  creator: 'JobTracker AI',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
  openGraph: {
    title: 'JobTracker AI – AI-Powered Job Application Tracker',
    description:
      'Track applications, generate AI-tailored CVs and cover letters, and land your next role faster.',
    url: siteUrl,
    siteName: 'JobTracker AI',
    images: [
      {
        url: '/assets/logo/jobtracker-logo.png',
        width: 512,
        height: 512,
        alt: 'JobTracker AI logo',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobTracker AI – AI-Powered Job Application Tracker',
    description: 'Track applications. Generate AI documents. Land jobs faster.',
    images: ['/assets/logo/jobtracker-logo.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'JobTracker AI',
      description: 'AI-powered job application tracking and document generation platform',
      inLanguage: 'en-GB',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#app`,
      name: 'JobTracker AI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description:
        'Track every job application and generate tailored AI resumes, cover letters, and supporting statements. Built for UK & international job seekers.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
      },
      featureList: [
        'Job application tracking dashboard',
        'AI-generated resumes and CVs',
        'AI cover letter generator',
        'AI supporting statement writer',
        'Job scraping from LinkedIn, Indeed and more',
        'PDF export',
        'Interview tracking',
        'Document version history',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is JobTracker AI free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, JobTracker AI is free to create an account and start tracking applications.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the AI document generation work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'JobTracker AI uses Google Gemini to analyse your profile, the job description, and any selection criteria to generate a tailored resume, cover letter, or supporting statement — without fabricating information.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can it scrape job listings automatically?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Paste a job URL from LinkedIn, Indeed, or other major boards and JobTracker AI will automatically extract the title, company, description, salary, and requirements.',
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
