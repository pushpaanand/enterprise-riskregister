import React, { useState } from 'react';
import { Risk, Owner, User } from '../types';

interface EditStatus {
  riskId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  count: number;
  latestChange: string;
  changedFields: string[];
  changes?: Array<{
    FieldName: string;
    OldValue: string | null;
    NewValue: string | null;
    ChangedAtUtc: string;
    RejectionReason?: string | null;
  }>;
}

interface RiskTableProps {
  risks: Risk[];
  owners: Owner[];
  users: User[];
  currentUser: User | null;
  onEdit: (risk: Risk) => void;
  onDelete: (riskId: string) => void;
  onApprove?: (risk: Risk) => void;
  onReject?: (risk: Risk) => void;
  onRowClick?: (risk: Risk) => void;
  onViewIncidents?: (risk: Risk) => void;
  onViewRiskHistory?: (risk: Risk) => void;
  incidentCounts?: Record<string, number>;
  editStatuses?: Record<string, EditStatus>; // riskId -> edit status
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
  'Rejected': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  'In Progress': 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  'Open': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  // New classification values used as stage
  'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Existing': 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
  'Downgraded': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Upgraded': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  'Eliminated': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const RiskTable: React.FC<RiskTableProps> = ({ risks, owners, users, currentUser, onEdit, onDelete, onApprove, onReject, onRowClick, onViewIncidents, onViewRiskHistory, incidentCounts = {}, editStatuses = {} }) => {
  const [selectedEditStatus, setSelectedEditStatus] = useState<EditStatus | null>(null);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);

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

  const handleEditStatusClick = (e: React.MouseEvent, riskId: string) => {
    e.stopPropagation();
    const status = editStatuses[riskId];
    if (status) {
      setSelectedEditStatus(status);
      setIsEditStatusModalOpen(true);
    }
  };

  const getEditStatusIcon = (status: EditStatus | undefined) => {
    if (!status) return null;

    if (status.status === 'Pending') {
      return (
        <button
          onClick={(e) => handleEditStatusClick(e, status.riskId)}
          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:opacity-80"
          title={`${status.count} edit(s) pending approval`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
          </svg>
          {status.count > 1 && <span className="text-xs">({status.count})</span>}
        </button>
      );
    } else if (status.status === 'Approved') {
      return (
        <button
          onClick={(e) => handleEditStatusClick(e, status.riskId)}
          className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:opacity-80"
          title={`${status.count} edit(s) approved`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
        </button>
      );
    } else if (status.status === 'Rejected') {
      return (
        <button
          onClick={(e) => handleEditStatusClick(e, status.riskId)}
          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:opacity-80"
          title={`${status.count} edit(s) rejected`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
          </svg>
          {status.count > 1 && <span className="text-xs">({status.count})</span>}
        </button>
      );
    }
    return null;
  };

  const baseColumns = 14; // Risk ID, Category, Description, Impact, Likelihood, Identification, KRI, Department, Existing Control, Plan of Action, Stage, Raised By, History, Last Updated
  const userHasRowActions = currentUser?.role === 'user' && risks.some(r => r.createdByUserId === currentUser?.id);
  const showActions = Boolean(currentUser?.role === 'manager' || userHasRowActions);
  const showEditStatus = currentUser?.role === 'user'; // Only show for users
  const totalColumns = showActions ? baseColumns + 1 : baseColumns;

  return (
    <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow w-full overflow-x-auto max-h-[70vh] overflow-y-auto">
      <table className="w-full min-w-[1800px] divide-y divide-base-300 dark:divide-dark-300">
        <thead className="bg-brand-secondary sticky top-0 z-10">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-brand-primary sm:pl-6 w-32">
              <div className="flex items-center gap-2">
                Risk ID
                {showEditStatus && (
                  <span className="text-xs font-normal text-base-content-muted dark:text-dark-content-muted">(Edit Status)</span>
                )}
              </div>
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary w-24">Category</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary min-w-[450px]">Risk Description</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Impact</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Likelihood</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Type</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">KRI</th>            
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Existing Control</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Plan of Action</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Stage</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">History</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Raised By</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Last Updated</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-brand-primary">Department</th>
            {showActions && (
                <th scope="col" className="py-3.5 pl-3 pr-4 text-left text-sm font-semibold text-brand-primary sm:pr-6 w-40">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300 dark:divide-dark-300">
          {risks.map((risk) => (
            <tr key={risk.id} onClick={() => onRowClick && onRowClick(risk)} className={onRowClick ? 'cursor-pointer hover:bg-base-100 dark:hover:bg-dark-100' : ''}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="flex items-center gap-2">
                  <span className="text-base-content dark:text-dark-content">{risk.riskNo || risk.id}</span>
                  {showEditStatus && getEditStatusIcon(editStatuses[risk.id])}
                </div>
              </td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content w-24 break-words">{risk.category || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm min-w-[450px]">
                <div className="text-base-content dark:text-dark-content break-words max-w-none">{risk.description}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${impactColorMap[risk.impact] || impactColorMap['Moderate']}`}>{risk.impact || 'Moderate'}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.likelihood || 'Possible'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.identification || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.riskIndicator || '-'}</td>              
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.existingControlInPlace || '-'}</td>
              <td className="whitespace-normal px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.planOfAction || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColorMap[risk.status] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>{risk.status}</span>
                  {risk.status === 'Rejected' && risk.rejectionReason && (
                    <span className="text-xs text-red-600 dark:text-red-400 max-w-[220px] break-words">
                      Reason: {risk.rejectionReason}
                    </span>
                  )}
                </div>
              </td>              
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
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{getRaisedBy(risk)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content-muted dark:text-dark-content-muted">{new Date(risk.updatedAt).toLocaleDateString()}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-base-content dark:text-dark-content">{risk.department || '-'}</td>
              {showActions && (
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 w-40" onClick={(e) => e.stopPropagation()}>
                  {currentUser?.role === 'manager' && (
                    <>
                      {risk.status === 'Raised' && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onApprove && onApprove(risk)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject && onReject(risk)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Reject
                          </button>
                        </div>
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

      {/* Edit Status Modal */}
      {isEditStatusModalOpen && selectedEditStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsEditStatusModalOpen(false)}>
          <div className="bg-base-100 dark:bg-dark-100 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-base-content dark:text-dark-content">
                  Edit Status: {selectedEditStatus.status}
                </h3>
                <button
                  onClick={() => setIsEditStatusModalOpen(false)}
                  className="text-base-content-muted dark:text-dark-content-muted hover:text-base-content dark:hover:text-dark-content"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-base-content-muted dark:text-dark-content-muted mb-2">
                    <strong>Status:</strong> <span className={`font-semibold ${
                      selectedEditStatus.status === 'Pending' ? 'text-amber-600 dark:text-amber-400' :
                      selectedEditStatus.status === 'Approved' ? 'text-green-600 dark:text-green-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>{selectedEditStatus.status}</span>
                  </p>
                  <p className="text-sm text-base-content-muted dark:text-dark-content-muted mb-2">
                    <strong>Total Edits:</strong> {selectedEditStatus.count}
                  </p>
                  <p className="text-sm text-base-content-muted dark:text-dark-content-muted mb-2">
                    <strong>Changed Fields:</strong> {selectedEditStatus.changedFields.join(', ') || 'N/A'}
                  </p>
                  <p className="text-sm text-base-content-muted dark:text-dark-content-muted">
                    <strong>Latest Change:</strong> {new Date(selectedEditStatus.latestChange).toLocaleString()}
                  </p>
                </div>

                {selectedEditStatus.changes && selectedEditStatus.changes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-base-content dark:text-dark-content mb-2">Edit Details:</h4>
                    <div className="space-y-3">
                      {selectedEditStatus.changes.map((change, idx) => (
                        <div key={idx} className="border border-base-300 dark:border-dark-300 rounded p-3">
                          <p className="text-sm font-medium text-base-content dark:text-dark-content mb-1">
                            <strong>Field:</strong> {change.FieldName}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-base-content-muted dark:text-dark-content-muted">Old Value:</p>
                              <p className="text-base-content dark:text-dark-content break-words">{change.OldValue || '(empty)'}</p>
                            </div>
                            <div>
                              <p className="text-base-content-muted dark:text-dark-content-muted">New Value:</p>
                              <p className="text-base-content dark:text-dark-content break-words">{change.NewValue || '(empty)'}</p>
                            </div>
                          </div>
                          {change.RejectionReason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              <strong>Rejection Reason:</strong> {change.RejectionReason}
                            </p>
                          )}
                          <p className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">
                            Changed: {new Date(change.ChangedAtUtc).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsEditStatusModalOpen(false)}
                  className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskTable;