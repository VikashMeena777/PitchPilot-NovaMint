import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PitchPilot",
  description: "PitchPilot's privacy policy explaining how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 5, 2026";

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
            <p>When you use PitchPilot, we collect the following information:</p>
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

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">3. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase (hosted on AWS infrastructure) with row-level security policies
              enforcing strict data isolation between users. Sensitive credentials such as SMTP passwords are encrypted
              using AES-256-GCM encryption before storage. All data transmission uses HTTPS/TLS encryption.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share information only with:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Service Providers:</strong> Resend (email delivery), Groq and Google (AI processing), Cashfree (payments), Supabase (database).</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental regulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">5. Your Rights (GDPR / CCPA)</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 space-y-1.5 mt-2">
              <li><strong>Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Update or correct inaccurate data via your Settings page.</li>
              <li><strong>Deletion:</strong> Request complete deletion of your account and all associated data.</li>
              <li><strong>Portability:</strong> Export your prospect data and email history.</li>
              <li><strong>Objection:</strong> Opt out of data processing for specific purposes.</li>
              <li><strong>Do Not Sell:</strong> We do not sell personal information (CCPA compliance).</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@novamintnetworks.in" className="text-[var(--pp-accent1)] hover:underline">privacy@novamintnetworks.in</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">6. Email Compliance</h2>
            <p>
              PitchPilot is designed to comply with CAN-SPAM, GDPR, and CCPA regulations. All outreach emails sent
              through our platform include an unsubscribe mechanism. We process unsubscribe requests immediately and
              permanently stop all email communications to unsubscribed contacts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We may use analytics cookies (PostHog)
              to understand usage patterns. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. Upon account deletion, we remove all personal
              data within 30 days, except where retention is required for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. Material changes will be communicated via email or in-app
              notification. Continued use of PitchPilot after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--pp-text-primary)] mb-3">10. Contact Us</h2>
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
            &larr; Back to PitchPilot
          </a>
        </div>
      </div>
    </div>
  );
}
