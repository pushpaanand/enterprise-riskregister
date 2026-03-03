import React from 'react';
import Modal from './ui/Modal';

export type PendingDetailType = 'risk-edit' | 'incident-new' | 'incident-edit';

interface PendingActionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PendingDetailType | null;
  data: any;
  showActions: boolean;
  isApproving?: boolean;
  onApproveEdit?: (riskId: string, historyId: number) => void;
  onRejectEdit?: (riskId: string, riskNo?: string) => void;
  onApproveIncident?: (incidentId: string) => void;
  onRejectIncident?: (incidentId: string) => void;
  onApproveIncidentEdit?: (incidentId: string, historyId: number) => void;
  onRejectIncidentEdit?: (incidentId: string) => void;
  onRefresh?: () => void;
}

const sectionClass = 'rounded-md border border-base-300 dark:border-dark-300 p-3 text-sm';
const labelClass = 'font-semibold text-base-content dark:text-dark-content';

const PendingActionDetailModal: React.FC<PendingActionDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  showActions,
  isApproving = false,
  onApproveEdit,
  onRejectEdit,
  onApproveIncident,
  onRejectIncident,
  onApproveIncidentEdit,
  onRejectIncidentEdit,
  onRefresh,
}) => {
  if (!isOpen || !type || !data) return null;

  const title =
    type === 'risk-edit'
      ? 'Pending risk edit – full details'
      : type === 'incident-new'
        ? 'Pending new incident – full details'
        : 'Pending incident edit – full details';

  const renderRiskEdit = () => {
    const pe = data;
    const riskIdStr = String(pe.RiskId || pe.riskId || '');
    const firstHistoryId = pe.pendingChanges?.[0]?.RiskHistoryId ?? pe.pendingChanges?.[0]?.riskHistoryId;
    const changes = pe.pendingChanges || [];
    return (
      <>
        <div className={sectionClass}>
          <div className="grid gap-2">
            <div><span className={labelClass}>Risk ID:</span> {pe.RiskNo || pe.riskNo || '-'}</div>
            <div><span className={labelClass}>Description:</span> {pe.RiskDescription || pe.riskDescription || '-'}</div>
            <div><span className={labelClass}>Department:</span> {pe.DepartmentName || pe.departmentName || '-'}</div>
            <div><span className={labelClass}>Changed by:</span> {pe.ChangedByName || pe.changedByName || '-'}</div>
            <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">
              First change: {pe.FirstPendingChange ? new Date(pe.FirstPendingChange).toLocaleString() : '-'} • {changes.length} change(s)
            </div>
          </div>
        </div>
        <div className={sectionClass}>
          <div className="font-semibold text-brand-primary mb-2">Pending changes</div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto divide-y divide-base-300 dark:divide-dark-300 text-sm">
              <thead className="bg-brand-secondary">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-brand-primary">Field</th>
                  <th className="px-3 py-2 text-left font-semibold text-brand-primary">Old value</th>
                  <th className="px-3 py-2 text-left font-semibold text-brand-primary">New value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                {changes.map((c: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-base-content dark:text-dark-content">{c.FieldName ?? c.fieldName}</td>
                    <td className="px-3 py-2 text-base-content-muted dark:text-dark-content-muted whitespace-pre-wrap max-w-[200px] break-words">{c.OldValue ?? c.oldValue ?? ''}</td>
                    <td className="px-3 py-2 text-base-content dark:text-dark-content whitespace-pre-wrap max-w-[200px] break-words">{c.NewValue ?? c.newValue ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {showActions && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isApproving || !onApproveEdit || !firstHistoryId}
              onClick={async () => {
                if (!onApproveEdit || !firstHistoryId) return;
                await onApproveEdit(riskIdStr, firstHistoryId);
                onRefresh?.();
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isApproving ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={!onRejectEdit}
              onClick={() => {
                onRejectEdit?.(riskIdStr, pe.RiskNo || pe.riskNo);
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </>
    );
  };

  const renderIncidentNew = () => {
    const inc = data;
    const idStr = String(inc.IncidentId || inc.incidentId || '');
    return (
      <>
        <div className={sectionClass}>
          <div className="grid gap-2 space-y-2">
            <div><span className={labelClass}>Risk:</span> {inc.RiskNo || inc.riskNo || '-'}</div>
            <div><span className={labelClass}>Summary:</span> {inc.Summary || inc.summary || '-'}</div>
            <div><span className={labelClass}>Description:</span> <span className="whitespace-pre-wrap">{(inc.Description ?? inc.description) || '-'}</span></div>
            <div><span className={labelClass}>Occurred at:</span> {inc.OccurredAtUtc ? new Date(inc.OccurredAtUtc).toLocaleString() : inc.occurredAtUtc || '-'}</div>
            <div><span className={labelClass}>Department:</span> {inc.DepartmentName || inc.departmentName || '-'}</div>
            <div><span className={labelClass}>Created by:</span> {inc.CreatedByName || inc.createdByName || '-'}</div>
            <div><span className={labelClass}>Created at:</span> {inc.CreatedAtUtc ? new Date(inc.CreatedAtUtc).toLocaleString() : inc.createdAtUtc || '-'}</div>
          </div>
        </div>
        {showActions && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isApproving || !onApproveIncident}
              onClick={async () => {
                if (!onApproveIncident) return;
                await onApproveIncident(idStr);
                onRefresh?.();
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isApproving ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={!onRejectIncident}
              onClick={() => {
                onRejectIncident?.(idStr);
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </>
    );
  };

  const renderIncidentEdit = () => {
    const pe = data;
    const incidentIdStr = String(pe.IncidentId || pe.incidentId || '');
    const firstHistoryId = pe.pendingChanges?.[0]?.IncidentHistoryId ?? pe.pendingChanges?.[0]?.incidentHistoryId;
    const changes = pe.pendingChanges || [];
    return (
      <>
        <div className={sectionClass}>
          <div className="grid gap-2">
            <div><span className={labelClass}>Risk:</span> {pe.RiskNo || pe.riskNo || '-'}</div>
            <div><span className={labelClass}>Incident summary:</span> {pe.IncidentSummary || pe.incidentSummary || '-'}</div>
            <div><span className={labelClass}>Department:</span> {pe.DepartmentName || pe.departmentName || '-'}</div>
            <div><span className={labelClass}>Changed by:</span> {pe.ChangedByName || pe.changedByName || '-'}</div>
            <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">
              First change: {pe.FirstPendingChange ? new Date(pe.FirstPendingChange).toLocaleString() : '-'} • {changes.length} change(s)
            </div>
          </div>
        </div>
        <div className={sectionClass}>
          <div className="font-semibold text-brand-primary mb-2">Pending changes</div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto divide-y divide-base-300 dark:divide-dark-300 text-sm">
              <thead className="bg-brand-secondary">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-brand-primary">Field</th>
                  <th className="px-3 py-2 text-left font-semibold text-brand-primary">Old value</th>
                  <th className="px-3 py-2 text-left font-semibold text-brand-primary">New value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                {changes.map((c: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-base-content dark:text-dark-content">{c.FieldName ?? c.fieldName}</td>
                    <td className="px-3 py-2 text-base-content-muted dark:text-dark-content-muted whitespace-pre-wrap max-w-[200px] break-words">{c.OldValue ?? c.oldValue ?? ''}</td>
                    <td className="px-3 py-2 text-base-content dark:text-dark-content whitespace-pre-wrap max-w-[200px] break-words">{c.NewValue ?? c.newValue ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {showActions && (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isApproving || !onApproveIncidentEdit || !firstHistoryId}
              onClick={async () => {
                if (!onApproveIncidentEdit || !firstHistoryId) return;
                await onApproveIncidentEdit(incidentIdStr, firstHistoryId);
                onRefresh?.();
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isApproving ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={!onRejectIncidentEdit}
              onClick={() => {
                onRejectIncidentEdit?.(incidentIdStr);
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </>
    );
  };

  const body =
    type === 'risk-edit'
      ? renderRiskEdit()
      : type === 'incident-new'
        ? renderIncidentNew()
        : renderIncidentEdit();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {body}
      </div>
    </Modal>
  );
};

export default PendingActionDetailModal;
