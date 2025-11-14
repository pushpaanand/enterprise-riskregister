import React, { useEffect, useState, FormEvent } from 'react';
import { Incident, Risk } from '../types';
import Modal from './ui/Modal';

interface IncidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: Risk[];
  riskId?: string;
  incident?: Incident | null;
  onSave: (incident: Incident | Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'createdByUserId'> & { id?: string }) => void;
}

const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";
const selectStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 pl-3 pr-10 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";

const IncidentFormModal: React.FC<IncidentFormModalProps> = ({ isOpen, onClose, risks, riskId, incident, onSave }) => {
  const [selectedRiskId, setSelectedRiskId] = useState<string>(riskId || '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Open' | 'Closed'>('Open');
  const [followupStatus, setFollowupStatus] = useState<'Completed' | 'Pending' | 'Cancelled'>('Pending');
  const [calledBy, setCalledBy] = useState('');
  const [calledAt, setCalledAt] = useState('');
  const [callStatus, setCallStatus] = useState<'Positive' | 'Negative' | 'Neutral'>('Positive');
  const [callHappenedWith, setCallHappenedWith] = useState('');
  const [callRemarks, setCallRemarks] = useState('');
  const [overallTags, setOverallTags] = useState<string[]>([]);
  const [physicianStation, setPhysicianStation] = useState('');
  const [serviceRequested, setServiceRequested] = useState<'Yes' | 'No'>('No');

  useEffect(() => {
    if (incident) {
      setSelectedRiskId(incident.riskId);
      setDescription(incident.description);
      setStatus(incident.status);
    } else {
      setSelectedRiskId(riskId || risks[0]?.id || '');
      setDescription('');
      setStatus('Open');
      setFollowupStatus('Pending');
      setCalledBy('');
      setCalledAt('');
      setCallStatus('Positive');
      setCallHappenedWith('');
      setCallRemarks('');
      setOverallTags([]);
      setPhysicianStation('');
      setServiceRequested('No');
    }
  }, [incident, isOpen, riskId, risks]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      riskId: selectedRiskId,
      description,
      occurredAt: incident?.occurredAt || new Date().toISOString(),
      status,
      followupStatus,
      calledBy,
      calledAt,
      callStatus,
      callHappenedWith,
      callRemarks,
      overallTags,
      physicianStation,
      serviceRequested,
      id: incident?.id,
    } as any;
    onSave(payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={incident ? 'Edit Incident' : 'Add Incident'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Risk</label>
          <div className="mt-2">
            <select value={selectedRiskId} onChange={(e) => setSelectedRiskId(e.target.value)} className={selectStyles}>
              {risks.map(r => (
                <option key={r.id} value={r.id}>{r.riskNo || r.id}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Followup Status</label>
            <div className="mt-2">
              <select value={followupStatus} onChange={(e) => setFollowupStatus(e.target.value as any)} className={selectStyles}>
                <option>Completed</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Called By</label>
            <div className="mt-2">
              <input value={calledBy} onChange={(e) => setCalledBy(e.target.value)} className={inputStyles} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Called At</label>
            <div className="mt-2">
              <input type="datetime-local" value={calledAt} onChange={(e) => setCalledAt(e.target.value)} className={inputStyles} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Call Status</label>
            <div className="mt-2">
              <select value={callStatus} onChange={(e) => setCallStatus(e.target.value as any)} className={selectStyles}>
                <option>Positive</option>
                <option>Negative</option>
                <option>Neutral</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Call Happened With</label>
            <div className="mt-2">
              <input value={callHappenedWith} onChange={(e) => setCallHappenedWith(e.target.value)} className={inputStyles} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Description</label>
          <div className="mt-2">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyles} rows={3} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Call Remarks</label>
          <div className="mt-2">
            <textarea value={callRemarks} onChange={(e) => setCallRemarks(e.target.value)} className={inputStyles} rows={2} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Call Overall Status</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {['Diabetic','Compliance','On Medicine','Not Reported','Came for Review','Stable'].map(tag => (
              <label key={tag} className={`inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md border cursor-pointer ${overallTags.includes(tag) ? 'bg-brand-primary/20 text-brand-primary border-brand-primary' : 'border-base-300 dark:border-dark-300 text-base-content dark:text-dark-content'}`}>
                <input type="checkbox" className="sr-only" checked={overallTags.includes(tag)} onChange={(e) => {
                  if (e.target.checked) setOverallTags([...overallTags, tag]); else setOverallTags(overallTags.filter(t => t !== tag));
                }} />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Physician Station</label>
            <div className="mt-2">
              <input value={physicianStation} onChange={(e) => setPhysicianStation(e.target.value)} className={inputStyles} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Service Requested</label>
            <div className="mt-2">
              <select value={serviceRequested} onChange={(e) => setServiceRequested(e.target.value as any)} className={selectStyles}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Status</label>
          <div className="mt-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectStyles}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="rounded-md bg-base-300 dark:bg-dark-300 px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content shadow-sm hover:bg-base-200 dark:hover:bg-dark-200">Cancel</button>
          <button type="submit" className="rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default IncidentFormModal;

