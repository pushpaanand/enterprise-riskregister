import React from 'react';
import { IncidentHistory } from '../types';
import Modal from './ui/Modal';

interface IncidentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: IncidentHistory[];
}

const IncidentHistoryModal: React.FC<IncidentHistoryModalProps> = ({ isOpen, onClose, history }) => {
  const sorted = [...history].sort((a, b) => (a.changedAt < b.changedAt ? 1 : -1));
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Incident History">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-base-300 dark:divide-dark-300">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold text-base-content dark:text-dark-content">When</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-base-content dark:text-dark-content">Field</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-base-content dark:text-dark-content">Old</th>
              <th className="px-3 py-2 text-left text-sm font-semibold text-base-content dark:text-dark-content">New</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300 dark:divide-dark-300">
            {sorted.map(h => (
              <tr key={h.id}>
                <td className="px-3 py-2 text-sm text-base-content-muted dark:text-dark-content-muted">{new Date(h.changedAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{h.fieldName}</td>
                <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{h.oldValue}</td>
                <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{h.newValue}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-base-content-muted dark:text-dark-content-muted">No history yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default IncidentHistoryModal;

