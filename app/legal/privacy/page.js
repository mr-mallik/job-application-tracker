export const metadata = {
  title: 'Privacy Policy - Job Application Tracker',
  description: 'Privacy policy and data protection information',
};

export default function PrivacyPolicy() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 28, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-4">
          Job Application Tracker (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed
          to protecting your privacy and personal data. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our job application tracking
          service.
        </p>
        <p className="mb-4">
          This policy complies with the General Data Protection Regulation (GDPR), UK Data
          Protection Act 2018, and other applicable data protection laws.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Data Controller</h2>
        <p className="mb-4">
          The data controller responsible for your personal data is Job Application Tracker. For any
          questions about this policy or your data, please contact us at the details provided in
          Section 11.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>

        <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Information You Provide</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Account Information:</strong> Name, email address, password (encrypted)
          </li>
          <li>
            <strong>Profile Data:</strong> Professional designation, phone number, LinkedIn profile,
            portfolio URL, professional summary
          </li>
          <li>
            <strong>Resume Information:</strong> Work experience, education, skills, projects,
            interests, achievements
          </li>
          <li>
            <strong>Job Application Data:</strong> Job titles, company names, locations, salaries,
            application dates, job descriptions, requirements, custom notes
          </li>
          <li>
            <strong>Documents:</strong> Resumes, cover letters, supporting statements that you
            create or upload
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Automatically Collected Information</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Usage Data:</strong> How you interact with our service, features used, time
            spent
          </li>
          <li>
            <strong>Device Information:</strong> Browser type, operating system, IP address
          </li>
          <li>
            <strong>Cookies:</strong> See our Cookie Policy for detailed information
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Third-Party Data</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Job Board Scraping:</strong> When you provide a job posting URL, we extract
            publicly available information
          </li>
          <li>
            <strong>AI Processing:</strong> Your data may be processed by Google Gemini AI to
            generate or refine documents
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (GDPR)</h2>
        <p className="mb-4">We process your personal data under the following legal bases:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Consent:</strong> You provide explicit consent when creating an account and
            using our services
          </li>
          <li>
            <strong>Contract Performance:</strong> Processing necessary to provide you with our job
            tracking services
          </li>
          <li>
            <strong>Legitimate Interests:</strong> To improve our services, prevent fraud, and
            ensure security
          </li>
          <li>
            <strong>Legal Obligation:</strong> To comply with applicable laws and regulations
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. How We Use Your Information</h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>To create and manage your account</li>
          <li>To provide job application tracking functionality</li>
          <li>To generate AI-powered resumes, cover letters, and supporting statements</li>
          <li>To scrape and classify job posting information from URLs you provide</li>
          <li>To send verification emails and password reset codes</li>
          <li>To improve our services and develop new features</li>
          <li>To ensure security and prevent unauthorized access</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Data Sharing and Disclosure</h2>

        <h3 className="text-xl font-semibold mb-3 mt-6">6.1 Third-Party Service Providers</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>MongoDB:</strong> Database hosting for storing your data
          </li>
          <li>
            <strong>Google Gemini AI:</strong> AI model for document generation and job data
            classification
          </li>
          <li>
            <strong>Email Service (SMTP):</strong> For sending verification and password reset
            emails
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Data Transfers</h3>
        <p className="mb-4">
          Your data may be transferred to and processed in countries outside your country of
          residence. We ensure appropriate safeguards are in place, including Standard Contractual
          Clauses (SCCs) and adequacy decisions where applicable.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">6.3 We DO NOT:</h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Sell your personal data to third parties</li>
          <li>Share your data with advertisers or marketing companies</li>
          <li>Use your data for purposes other than providing our service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Your Rights Under GDPR</h2>
        <p className="mb-4">You have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Right to Access:</strong> Request a copy of your personal data
          </li>
          <li>
            <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data
          </li>
          <li>
            <strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion
            of your data
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> Limit how we use your data
          </li>
          <li>
            <strong>Right to Data Portability:</strong> Receive your data in a machine-readable
            format
          </li>
          <li>
            <strong>Right to Object:</strong> Object to processing based on legitimate interests
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time (doesn&apos;t
            affect prior processing)
          </li>
          <li>
            <strong>Right to Lodge a Complaint:</strong> File a complaint with your data protection
            authority
          </li>
        </ul>
        <p className="mb-4">
          To exercise any of these rights, please contact us using the details in Section 11.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
        <p className="mb-4">
          We retain your personal data only for as long as necessary to fulfill the purposes
          outlined in this policy:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Account Data:</strong> Retained until you delete your account or request erasure
          </li>
          <li>
            <strong>Application Data:</strong> Retained as long as your account is active
          </li>
          <li>
            <strong>Verification Codes:</strong> Deleted after 24 hours or upon successful
            verification
          </li>
          <li>
            <strong>Password Reset Codes:</strong> Deleted after 1 hour or upon successful reset
          </li>
          <li>
            <strong>Logs and Analytics:</strong> Retained for up to 90 days for security purposes
          </li>
        </ul>
        <p className="mb-4">
          After account deletion, we may retain certain data for legal compliance, dispute
          resolution, and enforcing our agreements for up to 7 years.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">9. Data Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational measures to protect your data:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Passwords are encrypted using industry-standard hashing algorithms</li>
          <li>JWT tokens with 7-day expiry for authentication</li>
          <li>HTTPS encryption for data transmission</li>
          <li>Access controls and authentication mechanisms</li>
          <li>Regular security assessments and updates</li>
          <li>Database encryption at rest</li>
        </ul>
        <p className="mb-4">
          While we strive to protect your data, no method of transmission over the internet is 100%
          secure. You are responsible for maintaining the confidentiality of your password.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
        <p className="mb-4">
          Our service is not intended for individuals under 16 years of age. We do not knowingly
          collect personal data from children. If you believe we have collected data from a child,
          please contact us immediately.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
        <p className="mb-4">For questions, concerns, or to exercise your rights, please contact:</p>
        <div className="bg-muted p-4 rounded-lg mb-4">
          <p className="mb-2">
            <strong>Data Protection Officer</strong>
          </p>
          <p className="mb-1">Email: privacy@jobtracker.app</p>
          <p className="mb-1">Address: [Your Company Address]</p>
        </div>
        <p className="mb-4">
          You also have the right to lodge a complaint with your local supervisory authority:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>EU:</strong> Your national Data Protection Authority
          </li>
          <li>
            <strong>UK:</strong> Information Commissioner&apos;s Office (ICO) - ico.org.uk
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
        <p className="mb-4">
          If you are accessing our service from outside the country where our servers are located,
          your data may be transferred across international borders. We ensure adequate protection
          through:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>European Commission approved Standard Contractual Clauses (SCCs)</li>
          <li>Adequacy decisions for countries with equivalent data protection laws</li>
          <li>Privacy Shield certification where applicable</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated &quot;Last updated&quot; date. Material changes will be notified via email
          or a prominent notice in our service. Continued use after changes constitutes acceptance
          of the new policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">14. AI-Powered Features</h2>
        <p className="mb-4">
          Our service uses Google Gemini AI for document generation and job data classification.
          When using these features:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            Your profile data and job descriptions are sent to Google&apos;s AI service for
            processing
          </li>
          <li>We instruct the AI to never fabricate information and only use provided content</li>
          <li>AI-generated content is returned to you for review before saving</li>
          <li>Google&apos;s AI Privacy Policy applies to data processed through their service</li>
          <li>We implement retry logic and fallback models to ensure reliability</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">15. Web Scraping Disclaimer</h2>
        <p className="mb-4">
          When you provide a job posting URL, we use automated tools to extract publicly available
          information. This feature:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Only accesses publicly available job postings</li>
          <li>Respects robots.txt and website terms of service</li>
          <li>Is used solely to assist you in tracking your applications</li>
          <li>Does not store job board credentials or private data</li>
        </ul>
      </section>

      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Questions?</h3>
        <p className="text-sm">
          If you have any questions about this Privacy Policy or our data practices, please
          don&apos;t hesitate to contact us at{' '}
          <a href="mailto:privacy@jobtracker.app" className="text-blue-600 hover:underline">
            privacy@jobtracker.app
          </a>
        </p>
      </div>
    </div>
  );
}
