import React, { useEffect, useState } from 'react';
import { apiUrl } from '../api';

interface UnitHead {
  id: string;
  name: string;
  email?: string;
  unit?: string;
}

const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 px-3 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";

const UnitHeadMailer: React.FC = () => {
  const [unitHeads, setUnitHeads] = useState<UnitHead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [subject, setSubject] = useState('Risk Notification: Action required for your unit');
  const [body, setBody] = useState(`Dear Unit Head,

A new risk has been reported that may impact your unit.

Summary:
- This risk description was raised by the department. Your unit could face related issues.
- Please review and confirm if any actions are required from your side.

Kindly acknowledge and advise on next steps.

Thanks.`);
  const [loading, setLoading] = useState(false);
  const [sentInfo, setSentInfo] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/users'));
        const data = await res.json();
        if (Array.isArray(data)) {
          const heads = data
            .filter((u: any) => u.IsUnitHead || (String(u.Role || '').toLowerCase() === 'unit_head'))
            .map((u: any) => ({
              id: u.UserId,
              name: u.Name,
              email: u.Email,
              unit: u.Unit
            }));
          setUnitHeads(heads);
        }
      } catch {}
    })();
  }, []);

  const toggle = (id: string) => {
    setSelectedIds(s => ({ ...s, [id]: !s[id] }));
  };

  const onSend = async () => {
    const chosen = unitHeads.filter(u => selectedIds[u.id]);
    if (!chosen.length) {
      alert('Please select at least one unit head');
      return;
    }
    setLoading(true);
    setSentInfo('');
    try {
      const res = await fetch(apiUrl('/notifications/unit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: chosen.map(c => c.id),
          subject,
          content: body
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send');
      setSentInfo(`Sent to ${data.sent} recipient(s).`);
    } catch (e: any) {
      setSentInfo(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-base-content dark:text-dark-content">Email Unit Heads</h2>
        <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">Select unit heads and send a customizable message. Only the selected recipients will receive the email.</p>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6 space-y-4">
        <div className="max-h-56 overflow-auto border border-base-300 dark:border-dark-300 rounded-md">
          {unitHeads.map(u => (
            <label key={u.id} className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 border-base-300 dark:border-dark-300">
              <input type="checkbox" className="accent-brand-primary" checked={!!selectedIds[u.id]} onChange={() => toggle(u.id)} />
              <div className="flex-1">
                <div className="text-sm text-base-content dark:text-dark-content">{u.name}{u.unit ? ` • ${u.unit}` : ''}</div>
                {u.email && <div className="text-xs text-base-content-muted dark:text-dark-content-muted">{u.email}</div>}
              </div>
            </label>
          ))}
          {unitHeads.length === 0 && (
            <div className="px-3 py-4 text-sm text-base-content-muted dark:text-dark-content-muted">No unit heads found.</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Subject</label>
          <input className={inputStyles + ' mt-1'} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Email Content</label>
          <textarea rows={8} className={inputStyles + ' mt-1'} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onSend} disabled={loading} className="inline-flex items-center rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Email'}
          </button>
          {sentInfo && <span className="text-sm text-base-content-muted dark:text-dark-content-muted">{sentInfo}</span>}
        </div>
      </div>
    </div>
  );
};

export default UnitHeadMailer;
