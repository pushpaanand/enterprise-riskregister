import React, { useMemo, useState } from 'react';
import { Incident, Risk } from '../types';
import Modal from './ui/Modal';

interface RiskIncidentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: Risk | null;
  incidents: Incident[];
}

const RiskIncidentHistoryModal: React.FC<RiskIncidentHistoryModalProps> = ({ isOpen, onClose, risk, incidents }) => {
  const sorted = useMemo(() => incidents.sort((a,b) => (a.occurredAt < b.occurredAt ? 1 : -1)), [incidents]);
  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id || null);
  const active = sorted.find(i => i.id === activeId) || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Incidents - ${risk?.riskNo || risk?.id || ''}`}>
      <div className="grid grid-cols-12 gap-4 max-h-[70vh]">
        {/* Left timeline */}
        <div className="col-span-4 overflow-y-auto pr-2">
          {sorted.map(i => (
            <button key={i.id} onClick={() => setActiveId(i.id)} className={`w-full text-left mb-3 rounded-md px-4 py-3 border ${activeId===i.id?'border-brand-primary bg-brand-primary/10':'border-base-300 dark:border-dark-300 bg-base-200 dark:bg-dark-200'}`}>
              <div className="text-sm font-semibold text-base-content dark:text-dark-content">{new Date(i.occurredAt).toLocaleDateString()}</div>
              <div className="text-xs text-base-content-muted dark:text-dark-content-muted">Status: {i.status}</div>
            </button>
          ))}
          {sorted.length === 0 && (
            <div className="text-sm text-base-content-muted dark:text-dark-content-muted">No incidents yet.</div>
          )}
        </div>
        {/* Right details */}
        <div className="col-span-8 overflow-y-auto pl-2">
          {active ? (
            <div className="space-y-3">
              <div className="text-sm"><span className="font-semibold">Incident Summary:</span> {active.summary || '-'}</div>
              <div className="text-sm"><span className="font-semibold">Incident Reported Date:</span> {active.occurredAt ? new Date(active.occurredAt).toLocaleDateString() : '-'}</div>
              <div className="text-sm"><span className="font-semibold">Incident Description:</span> {active.description}</div>
              <div className="text-sm"><span className="font-semibold">Mitigation Steps:</span> {active.mitigationSteps || '-'}</div>
              <div className="text-sm"><span className="font-semibold">Current Status:</span> {active.currentStatusText || '-'}</div>
              <div className="text-sm"><span className="font-semibold">Closed Date:</span> {active.closedDate ? new Date(active.closedDate).toLocaleDateString() : '-'}</div>
            </div>
          ) : (
            <div className="text-sm text-base-content-muted dark:text-dark-content-muted">Select an incident to view details.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RiskIncidentHistoryModal;

