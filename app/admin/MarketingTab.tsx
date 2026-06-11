'use client';
import { useState } from 'react';
import { Mail, Send, Bell, Smartphone } from 'lucide-react';

export default function MarketingTab() {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAudience, setEmailAudience] = useState('all');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushAudience, setPushAudience] = useState('all');
  const [isSendingPush, setIsSendingPush] = useState(false);

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      alert("Please fill out the email subject and body.");
      return;
    }
    if (!confirm(`Are you sure you want to broadcast this email to ${emailAudience}?`)) {
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          audience: emailAudience
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Sent email to ${data.count} users in the ${emailAudience} segment.`);
        setEmailSubject('');
        setEmailBody('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert("Network error failed to send broadcast.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) {
      alert("Please fill out the push notification title and body.");
      return;
    }
    setIsSendingPush(true);
    // Placeholder for actual Firebase Cloud Messaging (FCM) API call
    setTimeout(() => {
      alert(`Sent push notification to ${pushAudience} users!`);
      setIsSendingPush(false);
      setPushTitle('');
      setPushBody('');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* EMAIL CAMPAIGN SECTION */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-background/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Email Campaigns</h2>
            <p className="text-sm text-muted">Blast emails to your creators and users.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Target Audience</label>
            <select 
              value={emailAudience}
              onChange={(e) => setEmailAudience(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-neo-pink transition-colors"
            >
              <option value="all">All Users</option>
              <option value="creators">Creators Only</option>
              <option value="fans">Fans Only</option>
              <option value="unverified">Unverified Creators</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Subject Line</label>
            <input 
              type="text" 
              placeholder="e.g. New Features are Live!"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-neo-pink transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Email Body (HTML/Text)</label>
            <textarea 
              rows={6}
              placeholder="Write your email content here..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-neo-pink transition-colors resize-y custom-scrollbar"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSendingEmail ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Send Broadcast</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PUSH NOTIFICATION SECTION */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-background/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-neo-pink/10 rounded-xl flex items-center justify-center text-neo-pink">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Push Notifications</h2>
            <p className="text-sm text-muted">Send app notifications instantly via Firebase FCM.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Target Audience</label>
                <select 
                  value={pushAudience}
                  onChange={(e) => setPushAudience(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-neo-pink transition-colors"
                >
                  <option value="all">All Users</option>
                  <option value="creators">Creators Only</option>
                  <option value="fans">Fans Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Notification Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Someone booked a call!"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-neo-pink transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Notification Message</label>
                <textarea 
                  rows={3}
                  placeholder="Keep it short and catchy..."
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-neo-pink transition-colors resize-none"
                />
              </div>

              <div className="flex justify-start pt-2">
                <button 
                  onClick={handleSendPush}
                  disabled={isSendingPush}
                  className="bg-neo-pink hover:bg-neo-pink/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSendingPush ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Smartphone className="w-4 h-4" /> Send Push</>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Preview */}
            <div className="bg-background border border-border rounded-xl p-6 flex flex-col items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted mb-6">iOS Preview</span>
              <div className="w-full max-w-xs bg-[#1C1C1E] rounded-2xl p-4 shadow-xl border border-[#2C2C2E]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-neo-pink rounded-lg flex items-center justify-center text-white font-bold text-xs">S</div>
                  <div className="flex-1">
                    <span className="text-white/50 text-xs font-medium uppercase">Supertime</span>
                  </div>
                  <span className="text-white/50 text-xs">now</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{pushTitle || 'Notification Title'}</h4>
                <p className="text-white/80 text-sm leading-snug line-clamp-2">{pushBody || 'This is how your message will appear on their lock screen.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
