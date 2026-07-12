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

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      setUsers(data.users || []);
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

  if (loading) return <div className="p-10 text-muted">Loading Users...</div>;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
        <h2 className="text-xl font-bold text-foreground">Registered Users</h2>
        <span className="bg-background border border-border text-muted px-4 py-1.5 rounded-full text-xs font-mono font-medium shadow-sm">
          {users.length} Total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted uppercase font-bold text-xs tracking-wider border-b border-border">
            <tr>
              <th className="p-5">Email</th>
              <th className="p-5">Username</th>
              <th className="p-5">Role</th>
              <th className="p-5">Balance</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u.email} className="hover:bg-background/50 transition-colors">
                <td className="p-5 font-mono text-muted text-xs">{u.email}</td>
                <td className="p-5 font-bold text-foreground">{u.username}</td>
                <td className="p-5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold ${u.role === 'Creator' ? 'bg-neo-pink/10 text-neo-pink border border-neo-pink/20' : 'bg-background border border-border text-muted'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-5 text-green-500 font-mono font-bold">{u.balance}</td>
                <td className="p-5 flex flex-col gap-1 items-start">
                  {u.isVerified && <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Verified</span>}
                  {u.isDisabled && <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Disabled</span>}
                  {!u.isVerified && !u.isDisabled && <span className="bg-background border border-border text-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase">Active</span>}
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleGive(u.email)} className="bg-surface hover:bg-green-500/10 text-green-500 border border-border hover:border-green-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm" disabled={actionLoading}>+ $</button>

                    {u.isVerified ? (
                      <button onClick={() => handleAction('unverify', u.email)} className="bg-surface hover:bg-background text-muted border border-border px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm" disabled={actionLoading}>Unverify</button>
                    ) : (
                      <button onClick={() => handleAction('verify', u.email)} className="bg-surface hover:bg-blue-500/10 text-blue-500 border border-border hover:border-blue-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm" disabled={actionLoading}>Verify</button>
                    )}

                    {u.isDisabled ? (
                      <button onClick={() => handleAction('enable', u.email)} className="bg-surface hover:bg-green-500/10 text-green-500 border border-border hover:border-green-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm" disabled={actionLoading}>Enable</button>
                    ) : (
                      <button onClick={() => handleAction('disable', u.email)} className="bg-surface hover:bg-red-500/10 text-red-500 border border-border hover:border-red-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm" disabled={actionLoading}>Ban</button>
                    )}

                    <button
                      onClick={() => handleAction('delete', u.email)}
                      className="bg-surface hover:bg-red-500 text-red-500 hover:text-white border border-border hover:border-red-500 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm"
                      disabled={actionLoading}
                    >
                      DEL
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
