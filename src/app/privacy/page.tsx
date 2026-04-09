import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PitchMint",
  description: "PitchMint's privacy policy explaining how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 9, 2026";

  return (
    <div className="min-h-screen bg-[var(--pp-bg-deepest)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1
          className="text-3xl font-bold text-[var(--pp-text-primary)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--pp-text-muted)] mb-10">
          Last updated: {lastUpdated}
        </p>

        <div className="prose prose-invert max-w-none space-y-8 text-[var(--pp-text-secondary)] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">1. Information We Collect</h2>
            <p>When you use PitchMint, we collect the following information:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Account Information:</strong> Name, email address, company name, and business details you provide during registration and onboarding.</li>
              <li><strong>Prospect Data:</strong> Contact information you upload or enter for your sales prospects, including names, email addresses, job titles, and company information.</li>
              <li><strong>Email Content:</strong> Email drafts, sent emails, and AI-generated content created through our platform.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our service, including pages visited, features used, and actions taken.</li>
              <li><strong>Payment Information:</strong> Billing details processed through our payment provider (Cashfree). We do not store full payment card details on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-1.5">
              <li>To provide and maintain our email outreach platform</li>
              <li>To generate AI-powered personalized emails and research insights</li>
              <li>To send emails on your behalf to your designated prospects</li>
              <li>To track email performance metrics (opens, clicks, replies)</li>
              <li>To process payments and manage your subscription</li>
              <li>To improve our AI models and service quality</li>
              <li>To send you service-related notifications and updates</li>
            </ul>
          </section>

          {/* Google-specific section required for OAuth verification */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">3. Google User Data &amp; Gmail Integration</h2>
            <p>
              PitchMint offers an optional Gmail integration that allows you to send outreach emails directly from your
              Gmail account. This section specifically addresses how we handle data obtained through Google APIs.
            </p>

            <h3 className="text-lg font-medium text-[var(--pp-text-primary)] mt-5 mb-2">3.1 What Google Data We Access</h3>
            <p>When you choose to connect your Gmail account, we request access to the following scopes:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Gmail Send (<code className="text-xs bg-[var(--pp-bg-card)] px-1.5 py-0.5 rounded">gmail.send</code>):</strong> Allows PitchMint to send outreach emails from your Gmail account on your behalf. We only send emails that you have explicitly composed or approved through our platform.</li>
              <li><strong>Email Address (<code className="text-xs bg-[var(--pp-bg-card)] px-1.5 py-0.5 rounded">userinfo.email</code>):</strong> Used to identify your Google account and display your connected Gmail address in your settings.</li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--pp-text-primary)] mt-5 mb-2">3.2 How We Use Google Data</h3>
            <p>Your Google data is used exclusively for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Sending Emails:</strong> We use the Gmail API to send outreach emails that you create, schedule, or approve through PitchMint. We never send unsolicited emails without your action.</li>
              <li><strong>Account Identification:</strong> We display your connected Gmail address in your Settings page so you can verify which account is connected.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> use your Google data for advertising, market research, or any purpose unrelated
              to the core functionality of sending emails through PitchMint.
            </p>

            <h3 className="text-lg font-medium text-[var(--pp-text-primary)] mt-5 mb-2">3.3 How We Store Google Data</h3>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>OAuth Tokens:</strong> We securely store your Gmail OAuth refresh token and access token in our database (Supabase, hosted on AWS). These tokens are stored in encrypted columns with row-level security, ensuring only your account can access them.</li>
              <li><strong>Gmail Address:</strong> Your connected Gmail address is stored in your user profile for display purposes.</li>
              <li><strong>No Email Content Storage:</strong> We do not read, store, or cache any emails from your Gmail inbox. The <code className="text-xs bg-[var(--pp-bg-card)] px-1.5 py-0.5 rounded">gmail.send</code> scope only allows sending — not reading your inbox.</li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--pp-text-primary)] mt-5 mb-2">3.4 How to Disconnect &amp; Delete Google Data</h3>
            <p>You can disconnect your Gmail account and delete all associated Google data at any time:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>From PitchMint:</strong> Go to <strong>Settings → Email Configuration → Gmail</strong> and click {'"'}Disconnect Gmail.{'"'} This immediately deletes your OAuth tokens from our database.</li>
              <li><strong>From Google:</strong> Visit <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[var(--pp-accent1)] hover:underline">Google Account Permissions</a> and revoke PitchMint&apos;s access. This invalidates all tokens on Google&apos;s side.</li>
              <li><strong>Account Deletion:</strong> If you delete your PitchMint account, all Google OAuth tokens and associated data are permanently deleted within 30 days.</li>
            </ul>

            <h3 className="text-lg font-medium text-[var(--pp-text-primary)] mt-5 mb-2">3.5 Google API Services User Data Policy Compliance</h3>
            <div className="mt-2 p-4 rounded-lg bg-[var(--pp-bg-card)] border border-[var(--pp-border-subtle)]">
              <p className="text-sm">
                PitchMint&apos;s use and transfer of information received from Google APIs adheres to the{" "}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--pp-accent1)] hover:underline">
                  Google API Services User Data Policy
                </a>
                , including the <strong>Limited Use requirements</strong>. Specifically:
              </p>
              <ul className="list-disc ml-6 space-y-1.5 mt-3 text-sm">
                <li>We only use Google data to provide and improve the email sending functionality you explicitly requested.</li>
                <li>We do <strong>not</strong> transfer Google data to third parties, except as necessary to provide the service (e.g., sending the email via Gmail API), with your explicit consent, or for legal/security reasons.</li>
                <li>We do <strong>not</strong> use Google data for serving advertisements.</li>
                <li>We do <strong>not</strong> allow humans to read your Google data, unless you provide affirmative consent for specific messages, it is necessary for security purposes, or it is required by law.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase (hosted on AWS infrastructure) with row-level security policies
              enforcing strict data isolation between users. Sensitive credentials such as SMTP passwords and OAuth tokens
              are encrypted using AES-256-GCM encryption before storage. All data transmission uses HTTPS/TLS encryption.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">5. Data Sharing</h2>
            <p>We do <strong>not</strong> sell your personal data. We share information only with:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Service Providers:</strong> Resend (email delivery), Groq and Google (AI processing), Cashfree (payments), Supabase (database), Google Gmail API (email sending when Gmail is connected).</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental regulation.</li>
            </ul>
            <p className="mt-3">
              We never sell, rent, or trade your data — including any data obtained from Google APIs — to any third party for any reason.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">6. Your Rights (GDPR / CCPA)</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Access:</strong> Request a copy of all personal data we hold about you, including any Google-related data.</li>
              <li><strong>Rectification:</strong> Update or correct inaccurate data via your Settings page.</li>
              <li><strong>Deletion:</strong> Request complete deletion of your account and all associated data, including Google OAuth tokens.</li>
              <li><strong>Portability:</strong> Export your prospect data and email history.</li>
              <li><strong>Objection:</strong> Opt out of data processing for specific purposes.</li>
              <li><strong>Revoke Google Access:</strong> Disconnect your Gmail at any time from Settings or from your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[var(--pp-accent1)] hover:underline">Google Account Permissions</a>.</li>
              <li><strong>Do Not Sell:</strong> We do not sell personal information (CCPA compliance).</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@novamintnetworks.in" className="text-[var(--pp-accent1)] hover:underline">privacy@novamintnetworks.in</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">7. Email Compliance</h2>
            <p>
              PitchMint is designed to comply with CAN-SPAM, GDPR, and CCPA regulations. All outreach emails sent
              through our platform include an unsubscribe mechanism. We process unsubscribe requests immediately and
              permanently stop all email communications to unsubscribed contacts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We may use analytics cookies (PostHog)
              to understand usage patterns. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">9. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. Upon account deletion, we remove all personal
              data — including Google OAuth tokens and any Gmail-related information — within 30 days, except where
              retention is required for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. Material changes will be communicated via email or in-app
              notification. Continued use of PitchMint after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">11. Contact Us</h2>
            <p>
              For privacy-related inquiries, contact us at{" "}
              <a href="mailto:privacy@novamintnetworks.in" className="text-[var(--pp-accent1)] hover:underline">
                privacy@novamintnetworks.in
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--pp-border-subtle)]">
          <a href="/" className="text-sm text-[var(--pp-accent1)] hover:underline">
            &larr; Back to PitchMint
          </a>
        </div>
      </div>
    </div>
  );
}
