export const metadata = {
  title: 'Cookie Policy - Job Application Tracker',
  description: 'Information about how we use cookies and similar technologies',
};

export default function CookiePolicy() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 28, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-4">
          This Cookie Policy explains how Job Application Tracker (&quot;we&quot;, &quot;our&quot;,
          or &quot;us&quot;) uses cookies and similar technologies when you use our service. This
          policy should be read together with our Privacy Policy and Terms of Service.
        </p>
        <p className="mb-4">
          By using our Service, you consent to the use of cookies in accordance with this policy. If
          you do not agree to our use of cookies, you should disable cookies through your browser
          settings or discontinue use of the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. What Are Cookies?</h2>
        <p className="mb-4">
          Cookies are small text files that are stored on your device (computer, tablet, or mobile)
          when you visit a website. They are widely used to make websites work more efficiently and
          provide information to the site owners.
        </p>
        <p className="mb-4">
          Cookies can be &quot;persistent&quot; (remain on your device until deleted or expired) or
          &quot;session&quot; cookies (deleted when you close your browser).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. How We Use Cookies</h2>
        <p className="mb-4">We use cookies and similar technologies for the following purposes:</p>

        <h3 className="text-xl font-semibold mb-3 mt-6">
          3.1 Essential Cookies (Strictly Necessary)
        </h3>
        <p className="mb-4">
          These cookies are necessary for the Service to function and cannot be disabled in our
          systems.
        </p>
        <div className="bg-muted p-4 rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Cookie Name</th>
                <th className="text-left py-2 pr-4">Purpose</th>
                <th className="text-left py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono">token</td>
                <td className="py-2 pr-4">Authentication - stores JWT token</td>
                <td className="py-2">7 days</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono">user</td>
                <td className="py-2 pr-4">Stores user information (name, email, profile data)</td>
                <td className="py-2">7 days</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">session_id</td>
                <td className="py-2 pr-4">Maintains your session state</td>
                <td className="py-2">Session</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-4">
          <strong>Legal Basis:</strong> These cookies are necessary for contract performance (GDPR
          Article 6(1)(b)) and cannot be disabled without affecting Service functionality.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Functional Cookies</h3>
        <p className="mb-4">These cookies enable enhanced functionality and personalization.</p>
        <div className="bg-muted p-4 rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Cookie Name</th>
                <th className="text-left py-2 pr-4">Purpose</th>
                <th className="text-left py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono">theme_preference</td>
                <td className="py-2 pr-4">Remembers your display preferences</td>
                <td className="py-2">1 year</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono">filter_state</td>
                <td className="py-2 pr-4">Remembers your job filter preferences</td>
                <td className="py-2">30 days</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">language</td>
                <td className="py-2 pr-4">Stores your language preference</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-4">
          <strong>Legal Basis:</strong> Consent (GDPR Article 6(1)(a)) or legitimate interests (GDPR
          Article 6(1)(f)).
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Performance and Analytics Cookies</h3>
        <p className="mb-4">
          These cookies help us understand how visitors interact with the Service by collecting and
          reporting information anonymously.
        </p>
        <div className="bg-muted p-4 rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Cookie Name</th>
                <th className="text-left py-2 pr-4">Purpose</th>
                <th className="text-left py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-mono">_analytics_id</td>
                <td className="py-2 pr-4">Tracks page views and user behavior</td>
                <td className="py-2">2 years</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">_performance</td>
                <td className="py-2 pr-4">Measures Service performance</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-4">
          <strong>Legal Basis:</strong> Consent (GDPR Article 6(1)(a)).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Local Storage</h2>
        <p className="mb-4">
          In addition to cookies, we use browser Local Storage to store data on your device:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>localStorage.token:</strong> JWT authentication token (expires after 7 days)
          </li>
          <li>
            <strong>localStorage.user:</strong> User profile data for quick access
          </li>
          <li>
            <strong>localStorage.preferences:</strong> UI preferences and settings
          </li>
        </ul>
        <p className="mb-4">
          Local Storage data persists until explicitly deleted by you or our application. This data
          is not transmitted to our servers unless you initiate an action that requires it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
        <p className="mb-4">We may use third-party services that set their own cookies:</p>

        <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Google Gemini AI</h3>
        <p className="mb-4">
          When using AI features, Google may set cookies according to their privacy policy. We do
          not have control over these cookies.
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Purpose: AI model processing and service delivery</li>
          <li>
            Privacy Policy:{' '}
            <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">
              https://policies.google.com/privacy
            </a>
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">5.2 MongoDB Services</h3>
        <p className="mb-4">
          Our database hosting provider may use cookies for service management.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Email Service Provider</h3>
        <p className="mb-4">
          Email verification and password reset emails may contain tracking pixels to measure
          delivery and open rates.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Cookie Duration</h2>
        <p className="mb-4">Cookies are set for different durations based on their purpose:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Session Cookies:</strong> Deleted when you close your browser
          </li>
          <li>
            <strong>Authentication Cookies:</strong> 7 days (matches JWT token expiry)
          </li>
          <li>
            <strong>Preference Cookies:</strong> 30 days to 1 year
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Up to 2 years
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Managing Cookies</h2>

        <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Browser Settings</h3>
        <p className="mb-4">
          Most browsers allow you to manage cookie preferences through their settings. You can:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>View which cookies are stored</li>
          <li>Delete cookies individually or all at once</li>
          <li>Block cookies from specific websites</li>
          <li>Block all cookies</li>
          <li>Delete cookies when closing the browser</li>
        </ul>

        <p className="mb-4">Browser-specific instructions:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
          </li>
          <li>
            <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
          </li>
          <li>
            <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
          </li>
          <li>
            <strong>Edge:</strong> Settings → Cookies and site permissions
          </li>
        </ul>

        <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Impact of Disabling Cookies</h3>
        <p className="mb-4">
          <strong className="text-red-600">Important:</strong> If you disable or delete essential
          cookies, the Service will not function properly. Specifically:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>You will not be able to log in or stay logged in</li>
          <li>Your preferences will not be saved</li>
          <li>Some features may be unavailable or malfunction</li>
        </ul>
        <p className="mb-4">
          Disabling non-essential cookies (analytics, marketing) will not affect core functionality
          but may limit our ability to improve the Service.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Clear Local Storage</h3>
        <p className="mb-4">To clear Local Storage data:</p>
        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>Open browser Developer Tools (F12)</li>
          <li>Go to &quot;Application&quot; or &quot;Storage&quot; tab</li>
          <li>Select &quot;Local Storage&quot;</li>
          <li>Right-click and select &quot;Clear&quot;</li>
        </ol>
        <p className="mb-4">
          Alternatively, log out from the Service to clear authentication data, or use the
          &quot;Clear browsing data&quot; option in your browser settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Do Not Track (DNT)</h2>
        <p className="mb-4">
          Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. Currently, there is no
          industry standard for interpreting DNT signals. We do not respond to DNT signals, but we
          minimize data collection and respect your privacy choices through browser settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">9. Cookies and GDPR Compliance</h2>
        <p className="mb-4">Under GDPR and ePrivacy Directive (Cookie Law):</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Strictly necessary cookies</strong> do not require consent (Article 6(1)(b) and
            Recital 49)
          </li>
          <li>
            <strong>Non-essential cookies</strong> require informed consent before placement
          </li>
          <li>You have the right to withdraw consent at any time</li>
          <li>Consent must be freely given, specific, informed, and unambiguous</li>
        </ul>
        <p className="mb-4">
          We provide clear information about cookies and obtain consent where required.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">10. Cookies Used by Service Features</h2>

        <h3 className="text-xl font-semibold mb-3 mt-6">10.1 Authentication System</h3>
        <p className="mb-4">
          Uses JWT tokens stored in Local Storage (not cookies) with 7-day expiry. This is more
          secure than traditional session cookies and allows for stateless authentication.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">10.2 Document Generation (AI Features)</h3>
        <p className="mb-4">
          AI processing is server-side and does not set additional cookies. Your profile data is
          temporarily sent to Google Gemini AI and not stored by them (per their policy).
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">10.3 Job Scraping</h3>
        <p className="mb-4">
          Web scraping is performed server-side using Playwright. No cookies are set on your device
          for this feature.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. International Transfers</h2>
        <p className="mb-4">
          Cookies may result in data transfer to servers located outside your country. We ensure
          appropriate safeguards are in place through:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Standard Contractual Clauses (SCCs) with third-party providers</li>
          <li>Adequacy decisions for countries with equivalent protection</li>
          <li>Privacy Shield certification where applicable</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">12. Updates to Cookie Policy</h2>
        <p className="mb-4">
          We may update this Cookie Policy to reflect changes in our practices or legal
          requirements. Updates will be posted on this page with a revised &quot;Last updated&quot;
          date.
        </p>
        <p className="mb-4">
          Material changes will be notified via email or prominent notice. Your continued use after
          changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
        <p className="mb-4">For questions about our use of cookies, please contact:</p>
        <div className="bg-muted p-4 rounded-lg mb-4">
          <p className="mb-2">
            <strong>Data Protection Officer</strong>
          </p>
          <p className="mb-1">Email: privacy@jobtracker.app</p>
          <p className="mb-1">Cookie Inquiries: cookies@jobtracker.app</p>
          <p className="mb-1">Address: [Your Company Address]</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">14. Cookie Audit</h2>
        <p className="mb-4">Last cookie audit performed: January 2026</p>
        <p className="mb-4">
          We regularly review and audit our cookie usage to ensure compliance and minimize data
          collection. This audit identifies:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>All cookies currently in use</li>
          <li>Their purpose and legal basis</li>
          <li>Duration and data collected</li>
          <li>Third-party cookies and their providers</li>
        </ul>
      </section>

      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Cookie Preferences</h3>
        <p className="text-sm mb-4">
          You can manage your cookie preferences at any time through your browser settings or by
          contacting us.
        </p>
        <p className="text-sm">
          Questions? Email us at{' '}
          <a href="mailto:cookies@jobtracker.app" className="text-blue-600 hover:underline">
            cookies@jobtracker.app
          </a>
        </p>
      </div>
    </div>
  );
}
