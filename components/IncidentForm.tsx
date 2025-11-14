import React, { useEffect, useState, FormEvent } from 'react';
import { Incident, Risk } from '../types';

interface IncidentFormProps {
  risks: Risk[];
  riskId?: string;
  incident?: Incident | null;
  onSave: (incident: Incident | Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'createdByUserId'> & { id?: string }) => void;
  onCancel?: () => void;
}

const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 px-3 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";
const selectStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 pl-3 pr-10 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";

const IncidentForm: React.FC<IncidentFormProps> = ({ risks, riskId, incident, onSave, onCancel }) => {
  const [selectedRiskId, setSelectedRiskId] = useState<string>(riskId || '');
  const [summary, setSummary] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [description, setDescription] = useState('');
  const [mitigationSteps, setMitigationSteps] = useState('');
  const [currentStatusText, setCurrentStatusText] = useState('');
  const [closedDate, setClosedDate] = useState<string | ''>('');
  // Status dropdown removed; using Current Status (free text) and Closed Date instead

  useEffect(() => {
    if (incident) {
      setSelectedRiskId(incident.riskId);
      setSummary(incident.summary || '');
      setOccurredAt(incident.occurredAt ? incident.occurredAt.substring(0, 16) : '');
      setDescription(incident.description);
      setMitigationSteps(incident.mitigationSteps || '');
      setCurrentStatusText(incident.currentStatusText || '');
      setClosedDate(incident.closedDate || '');
      // no dropdown status
    } else {
      setSelectedRiskId(riskId || risks[0]?.id || '');
      setSummary('');
      setOccurredAt(new Date().toISOString().substring(0, 16));
      setDescription('');
      setMitigationSteps('');
      setCurrentStatusText('');
      setClosedDate('');
      // no dropdown status
    }
  }, [incident, isFinite, riskId, risks]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      id: incident?.id,
      riskId: selectedRiskId,
      summary,
      occurredAt: occurredAt || new Date().toISOString(),
      description,
      mitigationSteps,
      currentStatusText,
      closedDate: closedDate || null,
      // no dropdown status
    } as any;
    onSave(payload);
  };

  const riskNo = risks.find(r => r.id === selectedRiskId)?.riskNo || selectedRiskId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Risk Number</label>
          {riskId ? (
            <input value={riskNo} readOnly className={inputStyles + ' mt-2'} />
          ) : (
            <select
              value={selectedRiskId}
              onChange={(e) => setSelectedRiskId(e.target.value)}
              className={selectStyles + ' mt-2'}
              required
            >
              <option value="" disabled>Select a risk</option>
              {risks.map(r => (
                <option key={r.id} value={r.id}>{r.riskNo} - {r.name || r.description}</option>
              ))}
            </select>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Incident Summary</label>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} required className={inputStyles + ' mt-2'} />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Incident Reported Date</label>
          <input type="month" value={occurredAt.slice(0,7)} onChange={(e) => setOccurredAt(e.target.value + '-01T00:00')} className={inputStyles + ' mt-2'} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Incident Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyles + ' mt-2'} rows={3} required />
      </div>
      <div>
        <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Mitigation Steps</label>
        <textarea value={mitigationSteps} onChange={(e) => setMitigationSteps(e.target.value)} className={inputStyles + ' mt-2'} rows={3} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Current Status</label>
          <input value={currentStatusText} onChange={(e) => setCurrentStatusText(e.target.value)} className={inputStyles + ' mt-2'} />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Closed Date</label>
          <input type="date" value={closedDate || ''} onChange={(e) => setClosedDate(e.target.value)} className={inputStyles + ' mt-2'} />
        </div>
      </div>
      {/* Status dropdown removed per requirements */}
      <div className="mt-6 flex justify-end gap-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md bg-base-300 dark:bg-dark-300 px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content hover:bg-base-200 dark:hover:bg-dark-200">Cancel</button>
        )}
        <button type="submit" className="rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90">Save Incident</button>
      </div>
    </form>
  );
};

export default IncidentForm;

