import React from 'react';
import { Incident, Risk, User } from '../types';

interface IncidentsTableProps {
  incidents: Incident[];
  risks: Risk[];
  currentUser: User | null;
  onEdit: (incident: Incident) => void;
  onClickIncident: (incident: Incident) => void; // open history
}

const statusColorMap = {
  'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const IncidentsTable: React.FC<IncidentsTableProps> = ({ incidents, risks, currentUser, onEdit, onClickIncident }) => {
  const riskNoFor = (riskId: string) => risks.find(r => r.id === riskId)?.riskNo || riskId;

  return (
    <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow w-full">
      <table className="w-full divide-y divide-base-300 dark:divide-dark-300 table-auto">
        <thead className="bg-brand-secondary">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-brand-primary sm:pl-6">Incident Summary</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Risk Number</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Incident Reported Date</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Incident Description</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Mitigation Steps</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Current Status</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Closed Date</th>
            <th className="py-3.5 pl-3 pr-4 text-left text-sm font-semibold text-brand-primary sm:pr-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300 dark:divide-dark-300">
          {incidents.map(inc => (
            <tr key={inc.id}>
              <td className="whitespace-normal py-4 pl-4 pr-3 text-sm sm:pl-6 text-base-content dark:text-dark-content">{inc.summary || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{riskNoFor(inc.riskId)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content-muted dark:text-dark-content-muted">{inc.occurredAt ? new Date(inc.occurredAt).toLocaleDateString() : '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{inc.description}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{inc.mitigationSteps || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{inc.currentStatusText || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content-muted dark:text-dark-content-muted">{inc.closedDate ? new Date(inc.closedDate).toLocaleDateString() : '-'}</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                {currentUser?.role === 'manager' ? (
                  <button onClick={() => onEdit(inc)} className="text-brand-primary hover:opacity-80">Edit</button>
                ) : null}
              </td>
            </tr>
          ))}
          {incidents.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-10 text-base-content-muted dark:text-dark-content-muted">No incidents found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default IncidentsTable;

