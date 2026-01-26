'use client';
import { useState, useEffect } from 'react';

type User = {
  email: string;
  username: string;
  role: string;
  balance: number;
  isVerified: boolean;
  isDisabled: boolean;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      setUsers(data.users || []);
      setConfig(data.config);
    } catch (e) {
      alert("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, email: string, amount?: number) => {
    if (!confirm(`Are you sure you want to ${action} ${email}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        body: JSON.stringify({ action, email, amount })
      });
      if (res.ok) {
        alert("Success!");
        fetchData();
      } else {
        alert("Action failed");
      }
    } catch (e) {
      alert("Error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGive = (email: string) => {
    const amt = prompt("Amount to give (TKN):", "1000");
    if (!amt) return;
    handleAction('give', email, parseInt(amt));
  };

  if (loading) return <div className="p-10">Loading Admin Panel...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🛠️ Supertime Admin</h1>
        <span className="bg-zinc-900 px-4 py-2 rounded-full text-xs font-mono">{users.length} Users</span>
      </div>

      {/* System Health Check */}
      {config && (
        <div className="bg-zinc-900 border border-zinc-700/50 p-6 rounded-2xl mb-8 flex gap-8">
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-1">Agora App ID</h3>
            <code className="text-green-400 font-mono">{config.agoraAppId}</code>
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-1">Agora Certificate</h3>
            <code className={`font-mono ${config.agoraCert.includes('MISSING') ? 'text-red-500' : 'text-blue-400'}`}>
              {config.agoraCert}
            </code>
          </div>
          <div className="flex-1 text-right">
            <span className="text-zinc-600 text-xs">Verify these match your Agora Console</span>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111] text-zinc-500 uppercase font-bold border-b border-zinc-800">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Balance</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map(u => (
              <tr key={u.email} className="hover:bg-zinc-800/50 transition-colors">
                <td className="p-4 font-mono">{u.email}</td>
                <td className="p-4 font-bold text-white">{u.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Creator' ? 'bg-purple-900 text-purple-200' : 'bg-zinc-800 text-zinc-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-green-400 font-mono font-bold">{u.balance}</td>
                <td className="p-4">
                  {u.isVerified && <span className="mr-2 text-blue-400">✅ Verified</span>}
                  {u.isDisabled && <span className="text-red-500">⛔ Disabled</span>}
                  {!u.isVerified && !u.isDisabled && <span className="text-zinc-500">Active</span>}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleGive(u.email)} className="bg-zinc-800 hover:bg-green-900 text-green-400 px-3 py-1 rounded font-bold text-xs" disabled={actionLoading}>+ $</button>

                  {u.isVerified ? (
                    <button onClick={() => handleAction('unverify', u.email)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1 rounded font-bold text-xs" disabled={actionLoading}>Unverify</button>
                  ) : (
                    <button onClick={() => handleAction('verify', u.email)} className="bg-blue-900/50 hover:bg-blue-900 text-blue-200 px-3 py-1 rounded font-bold text-xs" disabled={actionLoading}>Verify</button>
                  )}

                  {u.isDisabled ? (
                    <button onClick={() => handleAction('enable', u.email)} className="bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1 rounded font-bold text-xs" disabled={actionLoading}>Enable</button>
                  ) : (
                    <button onClick={() => handleAction('disable', u.email)} className="bg-zinc-800 hover:bg-red-900 text-red-400 px-3 py-1 rounded font-bold text-xs" disabled={actionLoading}>Ban</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
