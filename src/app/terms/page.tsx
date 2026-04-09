import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — PitchMint",
  description: "PitchMint terms of service. Please read these terms carefully.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-zinc-400">
              By accessing or using PitchMint (&ldquo;the Service&rdquo;), you agree to be bound 
              by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="text-zinc-400">
              PitchMint is an AI-powered cold email outreach platform that helps users manage 
              prospects, generate personalized emails, automate email sequences, and track 
              engagement metrics. The Service includes AI content generation, email delivery, 
              prospect research, and analytics.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Acceptable Use</h2>
            <p className="mb-3 text-zinc-400">You agree NOT to use PitchMint to:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>Send spam, unsolicited bulk email, or phishing emails</li>
              <li>Violate CAN-SPAM, GDPR, CCPA, or similar regulations</li>
              <li>Scrape data or harvest email addresses unlawfully</li>
              <li>Send emails containing malware, viruses, or harmful content</li>
              <li>Impersonate another person or entity</li>
              <li>Exceed your plan&apos;s sending limits or circumvent rate limits</li>
              <li>Use the AI to generate deceptive, fraudulent, or misleading content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>You are solely responsible for the content of emails sent through PitchMint</li>
              <li>You must have a lawful basis for contacting each prospect</li>
              <li>You must honor unsubscribe requests promptly</li>
              <li>You must keep your login credentials secure</li>
              <li>You must comply with all applicable laws in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. AI-Generated Content</h2>
            <p className="text-zinc-400">
              PitchMint uses AI to generate email content, research summaries, and suggestions. 
              While we strive for accuracy, AI-generated content may contain errors or inaccuracies. 
              You are responsible for reviewing and approving all content before sending. 
              PitchMint is not liable for any consequences arising from AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Account Plans & Billing</h2>
            <p className="text-zinc-400">
              PitchMint offers free and paid plans. Paid plans are billed monthly or annually. 
              You may cancel at any time, and cancellation takes effect at the end of the current 
              billing period. Refunds are not provided for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Termination</h2>
            <p className="text-zinc-400">
              We reserve the right to suspend or terminate your account if you violate these 
              Terms, engage in abusive sending practices, or generate excessive complaint rates. 
              Upon termination, your data will be deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="text-zinc-400">
              PitchMint is provided &ldquo;as is&rdquo; without warranties of any kind. We are 
              not liable for any indirect, incidental, or consequential damages arising from 
              your use of the Service, including but not limited to: email deliverability issues, 
              AI content inaccuracies, data loss, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Data Ownership</h2>
            <p className="text-zinc-400">
              You retain ownership of all data you upload to PitchMint, including prospect lists, 
              email templates, and custom content. We do not sell your data to third parties. 
              We may use anonymized, aggregated data to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p className="text-zinc-400">
              We may update these Terms from time to time. We will notify you of significant 
              changes via email or through the Service. Continued use after changes constitutes 
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
            <p className="text-zinc-400">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:support@pitchmint.dev" className="text-blue-400 hover:underline">
                support@pitchmint.dev
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
