import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-zinc-300">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <p className="mb-4 text-sm text-zinc-500 italic">Last Updated: March 9, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
        <p>Welcome to Supertime. We are committed to protecting your personal data and your privacy. This Privacy Policy outlines how we collect, use, and shared information when you use our Instagram automation services.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
        <p className="mb-2">When you connect your Instagram account to Supertime, we access the following via Meta APIs:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Basic Profile Info:</strong> Username and profile picture.</li>
          <li><strong>Messaging Data:</strong> Content of comments and direct messages (only to provide automated responses as configured by you).</li>
          <li><strong>Business Account Access:</strong> To manage comments and messages on your behalf.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Data</h2>
        <p>We use the data strictly to provide the "Instabot" automation features. This include:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Replying to comments based on your custom keywords.</li>
          <li>Sending automated Direct Messages as part of your marketing flows.</li>
          <li>Improving our service for better user experience.</li>
        </ul>
        <p className="mt-4"><strong>We do not sell your personal data to third parties.</strong></p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">4. Data Deletion Instructions</h2>
        <p className="mb-4">You have the right to request deletion of your data at any time. To delete your account and all associated Instagram data:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Login to your Supertime Dashboard.</li>
          <li>Go to Settings {'>'} Connections.</li>
          <li>Click 'Disconnect Instagram'. This will immediately revoke our access.</li>
          <li>To request a full removal of all historical logs from our servers, please email <a href="mailto:support@supertime.wtf" className="text-blue-400 underline">support@supertime.wtf</a> with the subject "Data Deletion Request". We will process this within 48 hours.</li>
        </ol>
      </section>

      <section className="mb-8 border-t border-zinc-800 pt-8 text-center text-zinc-500 text-sm">
        <p>© 2026 Supertime. All rights reserved.</p>
      </section>
    </div>
  );
}
