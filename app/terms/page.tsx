import React from 'react';
// Force redeploy to fix routing issues

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-zinc-300">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Use</h1>
      <p className="mb-4 text-sm text-zinc-500 italic">Last Updated: March 9, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
        <p>By accessing or using Supertime, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
        <p>Supertime provides automation tools for Instagram, including automated comment replies and direct messaging flows ("Instabot"). Our services are designed to help you engage with your audience more effectively.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
        <p className="mb-2">You are responsible for:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Compliance with Instagram/Meta's official Terms of Service.</li>
          <li>Ensuring your automated content does not violate spam, harassment, or community guidelines.</li>
          <li>Maintaining the security of your account and connection tokens.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">4. Limitations of Liability</h2>
        <p>Supertime is provided "as is". In no event shall Supertime be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use our services, even if we have been notified of the possibility of such damage.</p>
      </section>

      <section className="mb-8 border-t border-zinc-800 pt-8 text-center text-zinc-500 text-sm">
        <p>© 2026 Supertime. All rights reserved.</p>
      </section>
    </div>
  );
}
