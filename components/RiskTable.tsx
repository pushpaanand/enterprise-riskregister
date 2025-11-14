import React from 'react';
import { Risk, Owner, User } from '../types';

interface RiskTableProps {
  risks: Risk[];
  owners: Owner[];
  users: User[];
  currentUser: User | null;
  onEdit: (risk: Risk) => void;
  onDelete: (riskId: string) => void;
  onApprove?: (risk: Risk) => void;
  onRowClick?: (risk: Risk) => void;
  onViewIncidents?: (risk: Risk) => void;
  onViewRiskHistory?: (risk: Risk) => void;
  incidentCounts?: Record<string, number>;
}

const impactColorMap: Record<string, string> = {
    'Negligible': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Minor': 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300',
    'Moderate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Significant': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    'Severe': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const statusColorMap: Record<string, string> = {
  // Legacy workflow values
  'Raised': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  // New classification values used as stage
  'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Existing': 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
  'Downgraded': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Upgraded': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  'Eliminated': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const RiskTable: React.FC<RiskTableProps> = ({ risks, owners, users, currentUser, onEdit, onDelete, onApprove, onRowClick, onViewIncidents, onViewRiskHistory, incidentCounts = {} }) => {
  const getOwnerName = (ownerId: string) => {
    return owners.find(o => o.id === ownerId)?.name || 'Unknown';
  };
  const getRaisedBy = (risk: Risk) => {
    if (risk.raisedByName) return risk.raisedByName;
    if (risk.createdByUserId) {
      const u = users.find(x => x.id === risk.createdByUserId);
      if (u?.name) return u.name;
    }
    return getOwnerName(risk.ownerId);
  };

  const baseColumns = 11; // added Department + Incidents column
  const userHasRowActions = currentUser?.role === 'user' && risks.some(r => r.createdByUserId === currentUser?.id);
  const showActions = Boolean(currentUser?.role === 'manager' || userHasRowActions);
  const totalColumns = showActions ? baseColumns + 1 : baseColumns;

  return (
    <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow w-full overflow-x-auto">
      <table className="w-full min-w-[1800px] divide-y divide-base-300 dark:divide-dark-300 table-fixed">
        <thead className="bg-brand-secondary">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-brand-primary sm:pl-6">Risk ID</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Category</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Risk Description</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Department</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Identification</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Existing Control</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Plan of Action</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Impact</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Likelihood</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Stage</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Raised By</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">History</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Last Updated</th>
            {showActions && (
                <th scope="col" className="py-3.5 pl-3 pr-4 text-left text-sm font-semibold text-brand-primary sm:pr-6 w-40">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300 dark:divide-dark-300">
          {risks.map((risk) => (
            <tr key={risk.id} onClick={() => onRowClick && onRowClick(risk)} className={onRowClick ? 'cursor-pointer hover:bg-base-100 dark:hover:bg-dark-100' : ''}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 text-base-content dark:text-dark-content">{risk.riskNo || risk.id}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.category || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm">
                <div className="font-medium text-base-content dark:text-dark-content">{risk.name}</div>
                <div className="mt-1 text-base-content-muted dark:text-dark-content-muted text-xs break-words max-w-none">{risk.description}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.department || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.identification || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.existingControlInPlace || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.planOfAction || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${impactColorMap[risk.impact] || impactColorMap['Moderate']}`}>{risk.impact || 'Moderate'}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.likelihood || 'Possible'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                 <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColorMap[risk.status]}`}>{risk.status}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{getRaisedBy(risk)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewIncidents && onViewIncidents(risk); }}
                    className="inline-flex items-center gap-1 text-brand-primary hover:opacity-80"
                    aria-label="View incident history"
                    title="View incident history"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 3c-4.5 0-8 4.5-8 7s3.5 7 8 7 8-4.5 8-7-3.5-7-8-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                      <circle cx="10" cy="10" r="2.5" />
                    </svg>
                    <span>({incidentCounts[risk.id] || 0})</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewRiskHistory && onViewRiskHistory(risk); }}
                    className="p-1 rounded hover:bg-base-300/50 text-brand-primary"
                    aria-label="View risk change history"
                    title="View risk change history"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0-7.446-5.032.75.75 0 1 0 1.39-.56A6.5 6.5 0 1 1 10 16.5a.75.75 0 0 0 0 1.5Zm.75-10.75a.75.75 0 0 0-1.5 0v3.25c0 .199.079.39.22.53l2 2a.75.75 0 0 0 1.06-1.06l-1.78-1.78V7.25Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content-muted dark:text-dark-content-muted">{new Date(risk.updatedAt).toLocaleDateString()}</td>
              {showActions && (
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-40" onClick={(e) => e.stopPropagation()}>
                  {currentUser?.role === 'manager' && (
                    <>
                      {risk.status === 'Raised' && (
                        <button onClick={() => onApprove && onApprove(risk)} className="mr-4 text-green-600 hover:text-green-700">Approve</button>
                      )}
                      <button onClick={() => onEdit(risk)} className="text-brand-primary hover:opacity-80">Edit</button>
                      <button onClick={() => onDelete(risk.id)} className="ml-4 text-red-500 hover:text-red-700">Delete</button>
                    </>
                  )}
                  {currentUser?.role === 'user' && risk.createdByUserId === currentUser.id && (
                    risk.status === 'Raised'
                      ? (
                        <>
                          <button onClick={() => onEdit(risk)} className="text-brand-primary hover:opacity-80">Edit</button>
                          <button onClick={() => onDelete(risk.id)} className="ml-4 text-red-500 hover:text-red-700">Delete</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onEdit(risk)} className="text-brand-primary hover:opacity-80">Edit</button>
                        </>
                      )
                  )}
                </td>
              )}
            </tr>
          ))}
          {risks.length === 0 && (
            <tr>
              <td colSpan={totalColumns} className="text-center py-10 text-base-content-muted dark:text-dark-content-muted">
                No risks found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RiskTable;