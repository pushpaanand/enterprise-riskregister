import React, { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import { apiUrl } from '../api';

interface Entry {
  RiskHistoryId: number;
  RiskId: string;
  ChangedAtUtc: string;
  ChangedByUserId?: string | null;
  ChangedByName?: string | null;
  FieldName: string;
  OldValue?: string | null;
  NewValue?: string | null;
}

interface RiskChangeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: any | null;
}

const RiskChangeHistoryModal: React.FC<RiskChangeHistoryModalProps> = ({ isOpen, onClose, risk }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !risk?.id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/risks/${risk.id}/history`));
        const data = await res.json();
        if (Array.isArray(data)) setEntries(data);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, risk?.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Risk Change History">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {risk && (
          <div className="rounded-md border border-base-300 dark:border-dark-300 p-3 text-sm">
            <div><span className="font-semibold">Risk ID:</span> {risk.riskNo || risk.id}</div>
            <div><span className="font-semibold">Category:</span> {risk.category || '-'}</div>
            <div><span className="font-semibold">Description:</span> {risk.description}</div>
            <div><span className="font-semibold">Department:</span> {risk.department || '-'}</div>
            <div><span className="font-semibold">Identification:</span> {(risk as any).identification || '-'}</div>
            <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">
              Created: {risk.createdAt ? new Date(risk.createdAt).toLocaleString() : '-'} • Updated: {risk.updatedAt ? new Date(risk.updatedAt).toLocaleString() : '-'}
            </div>
          </div>
        )}

        <div className="rounded-md border border-base-300 dark:border-dark-300">
          <table className="w-full table-auto divide-y divide-base-300 dark:divide-dark-300">
            <thead className="bg-brand-secondary">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Changed At</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Changed By</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Field</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Old Value</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300 dark:divide-dark-300">
              {loading && (
                <tr><td colSpan={5} className="px-3 py-3 text-sm">Loading...</td></tr>
              )}
              {!loading && entries.map(e => (
                <tr key={`${e.RiskHistoryId}`} className="hover:bg-base-100 dark:hover:bg-dark-100">
                  <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{new Date(e.ChangedAtUtc).toLocaleString()}</td>
                  <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{e.ChangedByName || e.ChangedByUserId || ''}</td>
                  <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{e.FieldName}</td>
                  <td className="px-3 py-2 text-sm text-base-content-muted dark:text-dark-content-muted">{e.OldValue ?? ''}</td>
                  <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{e.NewValue ?? ''}</td>
                </tr>
              ))}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-base-content-muted dark:text-dark-content-muted">No changes recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default RiskChangeHistoryModal;
