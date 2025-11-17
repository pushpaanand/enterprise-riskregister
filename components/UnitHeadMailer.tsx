import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../api';

interface Recipient {
  id: string;
  name: string;
  email?: string;
  unit?: string;
  department?: string;
}

interface RecipientMailerProps {
  title: string;
  description: string;
  filter: (user: any) => boolean;
  defaultSubject: string;
  defaultBody: string;
}

const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 px-3 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";

const RecipientMailer: React.FC<RecipientMailerProps> = ({ title, description, filter, defaultSubject, defaultBody }) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentInfo, setSentInfo] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/users'));
        const data = await res.json();
        if (Array.isArray(data)) {
          const filtered = data
            .filter(filter)
            .map((u: any) => ({
              id: u.UserId,
              name: u.Name,
              email: u.Email,
              unit: u.Unit,
              department: u.Department,
            }));
          setRecipients(filtered);
        }
      } catch {
        setRecipients([]);
      }
    })();
  }, [filter]);

  const filteredRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter((r) =>
      [r.name, r.email, r.unit, r.department]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [recipients, search]);

  useEffect(() => {
    setShowAll(false);
  }, [search]);

  const visibleRecipients = useMemo(
    () => (showAll ? filteredRecipients : filteredRecipients.slice(0, 3)),
    [filteredRecipients, showAll]
  );

  const selectedCount = useMemo(
    () => recipients.filter(r => selectedIds[r.id]).length,
    [recipients, selectedIds]
  );

  const toggle = (id: string) => {
    setSelectedIds(s => ({ ...s, [id]: !s[id] }));
  };

  const toggleVisible = () => {
    const visibleIds = visibleRecipients.map(r => r.id);
    if (!visibleIds.length) return;
    const allSelected = visibleIds.every(id => selectedIds[id]);
    setSelectedIds(prev => {
      const next = { ...prev };
      visibleIds.forEach(id => {
        if (allSelected) {
          delete next[id];
        } else {
          next[id] = true;
        }
      });
      return next;
    });
  };

  const onSend = async () => {
    const chosen = recipients.filter(u => selectedIds[u.id]);
    if (!chosen.length) {
      alert('Please select at least one recipient');
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
        <h2 className="text-2xl font-bold leading-7 text-base-content dark:text-dark-content">{title}</h2>
        <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">{description}</p>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <input
              type="text"
              className={inputStyles}
              placeholder="Search by name, email, unit or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-3 text-sm text-base-content-muted dark:text-dark-content-muted">
              {/* <span>{filteredRecipients.length} visible • {selectedCount} selected</span> */}
              <button
                type="button"
                onClick={toggleVisible}
                className="rounded-md border border-base-300 dark:border-dark-300 px-3 py-1.5 text-sm text-base-content dark:text-dark-content hover:bg-base-300/50 dark:hover:bg-dark-300"
                disabled={!visibleRecipients.length}
              >
                {visibleRecipients.length && visibleRecipients.every(r => selectedIds[r.id]) ? 'Deselect Visible' : 'Select Visible'}
              </button>
              {filteredRecipients.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAll(prev => !prev)}
                  className="rounded-md border border-base-300 dark:border-dark-300 px-3 py-1.5 text-sm text-base-content dark:text-dark-content hover:bg-base-300/50 dark:hover:bg-dark-300"
                >
                  {showAll ? 'View less (show 3)' : `View all (${filteredRecipients.length})`}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-auto border border-base-300 dark:border-dark-300 rounded-md divide-y divide-base-300 dark:divide-dark-300">
            {visibleRecipients.map(u => (
              <label key={u.id} className="flex items-center gap-3 px-3 py-2">
                <input type="checkbox" className="accent-brand-primary" checked={!!selectedIds[u.id]} onChange={() => toggle(u.id)} />
                <div className="flex-1">
                  <div className="text-sm text-base-content dark:text-dark-content">{u.name}{u.unit ? ` • ${u.unit}` : ''}</div>
                  <div className="text-xs text-base-content-muted dark:text-dark-content-muted flex flex-col">
                    {u.email && <span>{u.email}</span>}
                    {u.department && <span>Dept: {u.department}</span>}
                  </div>
                </div>
              </label>
            ))}
            {!visibleRecipients.length && (
              <div className="px-3 py-4 text-sm text-base-content-muted dark:text-dark-content-muted">No recipients match your search.</div>
            )}
            {!showAll && filteredRecipients.length > 3 && (
              <div className="px-3 py-2 text-xs text-base-content-muted dark:text-dark-content-muted">
                Showing first 3 of {filteredRecipients.length}. Use “View all” to see everyone.
              </div>
            )}
          </div>
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

const UnitHeadMailer: React.FC = () => (
  <RecipientMailer
    title="Email Unit Heads"
    description="Select unit heads and send a customizable message. Only the selected recipients will receive the email."
    filter={(u) => u.IsUnitHead || (String(u.Role || '').toLowerCase() === 'unit_head')}
    defaultSubject="Risk Notification: Action required for your unit"
    defaultBody={`Dear Unit Head,

A new risk has been reported that may impact your unit.

Summary:
- This risk description was raised by the department. Your unit could face related issues.
- Please review and confirm if any actions are required from your side.

Kindly acknowledge and advise on next steps.

Thanks.`}
  />
);

export const ManagerMailer: React.FC = () => (
  <RecipientMailer
    title="Email Managers"
    description="Broadcast updates to one or more managers. You can search, select visible results, and customize the content."
    filter={(u) => String(u.Role || '').toLowerCase() === 'manager'}
    defaultSubject="Action Required: Risk escalation for your department"
    defaultBody={`Dear Manager,

Please review the recent risk escalation affecting your department.

Kindly log in to the Risk Dashboard, assess the associated incidents, and take the necessary action.

Thanks.`}
  />
);

export default UnitHeadMailer;
