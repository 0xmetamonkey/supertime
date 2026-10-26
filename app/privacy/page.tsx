import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-zinc-300">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      <p className="mb-4 text-sm text-zinc-500 italic">Last Updated: October 22, 2026</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
        <p>Welcome to Supertime (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your personal data and your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use the Supertime web platform and mobile applications.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">2. Device Permissions & Real-Time Communications</h2>
        <p className="mb-2">To provide interactive video calling and Supertalks matching, our mobile application requests access to the following device features:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Camera (android.permission.CAMERA):</strong> Used exclusively to capture your video stream during active 1-on-1 video calls. Video streams are transmitted in real time over peer-to-peer WebRTC connections. We do not record or store your camera feed on our servers.</li>
          <li><strong>Microphone (android.permission.RECORD_AUDIO):</strong> Used exclusively to capture your voice during active calls. Real-time audio streams are transmitted peer-to-peer and are never recorded or stored without explicit user notification.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">3. Account & Profile Information</h2>
        <p className="mb-2">We collect only necessary information to maintain your user account and facilitate interactions:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Authentication & Profile Data:</strong> Display name, email address, profile avatar, and authentication identifiers provided during sign-in.</li>
          <li><strong>Optional Integrations:</strong> When connecting external platforms (such as Instagram), we access only authorized APIs to perform automated actions you specifically configure.</li>
        </ul>
        <p className="mt-4 font-semibold text-white">We do not sell your personal data or communications to any third parties.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">4. Data Retention & Deletion</h2>
        <p className="mb-4">You have the right to request deletion of your account and all associated data at any time:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Sign in to your Supertime Account settings.</li>
          <li>Disconnect any linked accounts or request account closure.</li>
          <li>To request immediate, complete removal of all account records from our systems, email <a href="mailto:support@supertime.wtf" className="text-blue-400 underline">support@supertime.wtf</a> with the subject &quot;Data Deletion Request&quot;. Requests are processed within 48 hours.</li>
        </ol>
      </section>

      <section className="mb-8 border-t border-zinc-800 pt-8 text-center text-zinc-500 text-sm">
        <p>© 2026 Supertime. All rights reserved.</p>
      </section>
    </div>
  );
}
