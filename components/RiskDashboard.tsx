import React, { useState, useMemo } from 'react';
import { Risk, Owner, User, Incident, IncidentHistory, RiskLikelihood, RiskImpact } from '../types';
import RiskTable from './RiskTable';
import RiskFormModal from './RiskFormModal';
import { PlusIcon } from '../constants';
import RiskMatrix from './RiskMatrix';
import RiskIncidentHistoryModal from './RiskIncidentHistoryModal';
import IncidentsTable from './IncidentsTable';
import IncidentForm from './IncidentForm';
import IncidentHistoryModal from './IncidentHistoryModal';
import Modal from './ui/Modal';
import RiskChangeHistoryModal from './RiskChangeHistoryModal';

interface RiskDashboardProps {
  risks: Risk[];
  owners: Owner[];
  users: User[];
  currentUser: User | null;
  onSaveRisk: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onDeleteRisk: (riskId: string) => void;
  onApproveRisk?: (risk: Risk) => void;
  incidents?: Incident[];
  incidentHistory?: IncidentHistory[];
  onAddIncident?: (riskId: string, description: string) => void;
  onUpdateIncident?: (incident: Incident) => void;
  aiSummary?: string;
  aiLoading?: boolean;
  onRefreshSummary?: () => void;
  aiIncidentsSummary?: string;
  aiIncidentsLoading?: boolean;
  onRefreshIncidentsSummary?: () => void;
  onSetSummaryRiskId?: (riskId: string | null) => void;
  // Admin filters passed from parent (App) to move controls near tabs
  adminDeptOptions?: string[];
  adminDept?: string;
  onChangeAdminDept?: (v: string) => void;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ risks, owners, users, currentUser, onSaveRisk, onDeleteRisk, onApproveRisk, incidents = [], incidentHistory = [], onAddIncident, onUpdateIncident, aiSummary, aiLoading, onRefreshSummary, aiIncidentsSummary, aiIncidentsLoading, onRefreshIncidentsSummary, onSetSummaryRiskId, adminDeptOptions = [], adminDept = 'All', onChangeAdminDept }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riskToEdit, setRiskToEdit] = useState<Risk | null>(null);
  const summary = aiSummary || '';
  const isGeneratingSummary = !!aiLoading;
  const [isRiskHistoryOpen, setIsRiskHistoryOpen] = useState(false);
  const [historyRiskId, setHistoryRiskId] = useState<string | null>(null);
  const [isRiskChangeOpen, setIsRiskChangeOpen] = useState(false);
  const [riskChangeId, setRiskChangeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'risks' | 'new' | 'incidents'>('risks');
  const [incidentRiskId, setIncidentRiskId] = useState<string | undefined>(undefined);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyForIncidentId, setHistoryForIncidentId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showMatrix, setShowMatrix] = useState<boolean>(true);
  const [isAddingIncident, setIsAddingIncident] = useState<boolean>(false);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState<boolean>(false);
  const [kpiImpactFilter, setKpiImpactFilter] = useState<RiskImpact | null>(null);
  const [kpiLikelihoodFilter, setKpiLikelihoodFilter] = useState<RiskLikelihood | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [identificationFilter, setIdentificationFilter] = useState<string>('All');
  // Pagination
  const [riskPage, setRiskPage] = useState<number>(1);
  const [riskPageSize, setRiskPageSize] = useState<number>(10);
  const [newRiskPage, setNewRiskPage] = useState<number>(1);
  const [incPage, setIncPage] = useState<number>(1);
  const [incPageSize, setIncPageSize] = useState<number>(10);
  
  const openEditModal = (risk: Risk) => {
    setRiskToEdit(risk);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setRiskToEdit(null);
    setIsModalOpen(true);
  };

  const openIncidentForRisk = (risk: Risk) => {
    if (currentUser?.role === 'manager' || currentUser?.role === 'user') {
      setIncidentRiskId(risk.id);
      setEditingIncident(null);
      setIsAddingIncident(true);
    } else {
      setIncidentRiskId(undefined);
      setEditingIncident(null);
      setIsAddingIncident(false);
    }
  };

  const handleSaveIncident = (payload: any) => {
    if (payload.id) {
      onUpdateIncident && onUpdateIncident(payload as Incident);
    } else if (payload.riskId && payload.description) {
      onAddIncident && onAddIncident(payload.riskId, payload.description);
    }
  };

  const openIncidentHistory = (incidentId: string) => {
    setHistoryForIncidentId(incidentId);
    setIsHistoryOpen(true);
  };

  const riskStats = useMemo(() => {
    const total = risks.length;
    const severe = risks.filter(r => r.impact === 'Severe').length;
    const significant = risks.filter(r => r.impact === 'Significant').length;
    const moderate = risks.filter(r => r.impact === 'Moderate').length;
    const minor = risks.filter(r => r.impact === 'Minor').length;
    const negligible = risks.filter(r => r.impact === 'Negligible').length;
    return { total, severe, significant, moderate, minor, negligible };
  }, [risks]);

  const openKpiModal = (impact: RiskImpact, likelihood?: RiskLikelihood) => {
    setKpiImpactFilter(impact);
    setKpiLikelihoodFilter(likelihood ?? null);
    setIsKpiModalOpen(true);
  };

  const [summaryRiskId, setSummaryRiskId] = useState<string | 'ALL'>('ALL');
  const handleGenerateSummary = () => { onRefreshSummary && onRefreshSummary(); };
  const handleSummarySelect = (val: string) => {
    setSummaryRiskId(val as any);
    if (onSetSummaryRiskId) onSetSummaryRiskId(val === 'ALL' ? null : val);
  };

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-base-content dark:text-dark-content sm:truncate sm:text-3xl sm:tracking-tight">
            Risk Dashboard
          </h1>
          <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">
            A central place to track and manage project risks.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex items-center gap-3">
          {(currentUser?.role === 'user' || currentUser?.role === 'manager') && (
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-x-2 rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-colors"
            >
              <PlusIcon />
              Add New Risk
            </button>
          )}
          {activeTab !== 'incidents' && (
            <button
              type="button"
              onClick={() => setShowSummary(s => !s)}
              className={`inline-flex items-center rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${showSummary ? 'bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 focus-visible:outline-brand-primary' : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content hover:bg-base-300 dark:hover:bg-dark-200 focus-visible:outline-base-300'}`}
            >
              {showSummary ? 'Hide Summary' : 'Show Summary'}
            </button>
          )}
          {(activeTab === 'risks') && (currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
            <button
              type="button"
              onClick={() => setShowMatrix(m => !m)}
              className={`inline-flex items-center rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${showMatrix ? 'bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 focus-visible:outline-brand-primary' : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content hover:bg-base-300 dark:hover:bg-dark-200 focus-visible:outline-base-300'}`}
            >
              {showMatrix ? 'Hide Matrix' : 'Show Matrix'}
            </button>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setActiveTab('risks')} className={`px-3 py-1.5 text-sm rounded-md border ${activeTab==='risks'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Risks</button>
          <button onClick={() => setActiveTab('new')} className={`px-3 py-1.5 text-sm rounded-md border ${activeTab==='new'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>New Risks</button>
          <button onClick={() => setActiveTab('incidents')} className={`px-3 py-1.5 text-sm rounded-md border ${activeTab==='incidents'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Incidents</button>
          {currentUser?.role === 'admin' && (
            <>
              <label className="ml-2 text-sm text-base-content dark:text-dark-content">
                Department
                <select
                  value={adminDept}
                  onChange={(e) => onChangeAdminDept && onChangeAdminDept(e.target.value)}
                  className="ml-2 rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1.5 text-sm"
                >
                  {(adminDeptOptions.length ? adminDeptOptions : ['All']).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-6">
        <div className="overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-base-content-muted dark:text-dark-content-muted">Total</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-base-content dark:text-dark-content">{riskStats.total}</dd>
        </div>
        <button type="button" onClick={() => openKpiModal('Severe')} className="text-left overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 px-4 py-5 shadow sm:p-6 hover:ring-2 hover:ring-brand-primary cursor-pointer">
          <dt className="truncate text-sm font-medium text-base-content-muted dark:text-dark-content-muted">Severe</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-500">{riskStats.severe}</dd>
        </button>
        <button type="button" onClick={() => openKpiModal('Significant')} className="text-left overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 px-4 py-5 shadow sm:p-6 hover:ring-2 hover:ring-brand-primary cursor-pointer">
          <dt className="truncate text-sm font-medium text-base-content-muted dark:text-dark-content-muted">Significant</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-orange-500">{riskStats.significant}</dd>
        </button>
        <button type="button" onClick={() => openKpiModal('Moderate')} className="text-left overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 px-4 py-5 shadow sm:p-6 hover:ring-2 hover:ring-brand-primary cursor-pointer">
          <dt className="truncate text-sm font-medium text-base-content-muted dark:text-dark-content-muted">Moderate</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-500">{riskStats.moderate}</dd>
        </button>
        <button type="button" onClick={() => openKpiModal('Minor')} className="text-left overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 px-4 py-5 shadow sm:p-6 hover:ring-2 hover:ring-brand-primary cursor-pointer">
          <dt className="truncate text-sm font-medium text-base-content-muted dark:text-dark-content-muted">Minor</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-lime-600">{riskStats.minor}</dd>
        </button>
        <button type="button" onClick={() => openKpiModal('Negligible')} className="text-left overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 px-4 py-5 shadow sm:p-6 hover:ring-2 hover:ring-brand-primary cursor-pointer">
          <dt className="truncate text-sm font-medium text-base-content-muted dark:text-dark-content-muted">Negligible</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">{riskStats.negligible}</dd>
        </button>
      </dl>

      {activeTab !== 'incidents' && showSummary && (
        <div className="mt-8 bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content">AI-Powered Summary</h3>
          <div className="mt-2 text-sm text-base-content-muted dark:text-dark-content-muted">
              {summary ? <pre className="whitespace-pre-wrap">{summary}</pre> : <p>Click the button to generate an executive summary of the current risks.</p>}
              {isGeneratingSummary && <p className="animate-pulse">Generating summary...</p>}
          </div>
          <div className="mt-4 flex items-center gap-3">
              <label className="text-sm text-base-content dark:text-dark-content">
                Risk
                <select
                  value={summaryRiskId}
                  onChange={(e) => handleSummarySelect(e.target.value)}
                  className="ml-2 rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1.5 text-sm"
                >
                  <option value="ALL">All</option>
                  {risks.map(r => (
                    <option key={r.id} value={r.id}>{r.riskNo || r.id}</option>
                  ))}
                </select>
              </label>
              <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary || risks.length === 0}
                  className="rounded-md bg-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary shadow-sm hover:bg-brand-primary/30 disabled:opacity-50"
              >
                  {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
              </button>
          </div>
        </div>
      )}

      {(activeTab === 'risks') && showMatrix && (currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
        <div className="mt-8 bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content">Risk Matrix</h3>
          <p className="mt-2 text-sm text-base-content-muted dark:text-dark-content-muted">Counts by Impact × Likelihood</p>
          <div className="mt-4">
            <RiskMatrix
              risks={risks}
              onCellClick={(imp, like) => openKpiModal(imp, like)}
            />
          </div>
        </div>
      )}


      {activeTab === 'risks' ? (
        <div className="mt-8">
          {/* Filters */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content"
              >
                {['All','Raised','New','Existing','Downgraded','Upgraded','Eliminated'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Identification</label>
              <select
                value={identificationFilter}
                onChange={(e) => setIdentificationFilter(e.target.value)}
                className="rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content"
              >
                {['All','Inherent risk','Residual risk'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          {(() => {
            // Apply admin-level dept filter first
            let base = risks;
            if (currentUser?.role === 'admin') {
              if (adminDept && adminDept !== 'All') base = base.filter(r => String(r.department || '') === adminDept);
            }
            const filtered = base.filter(r => (statusFilter==='All' || r.status === statusFilter) && (identificationFilter==='All' || (r as any).identification === identificationFilter));
            const total = filtered.length;
            const start = (riskPage - 1) * riskPageSize;
            const pageItems = filtered.slice(start, start + riskPageSize);
            const totalPages = Math.max(1, Math.ceil(total / riskPageSize));
            if (riskPage > totalPages) setRiskPage(totalPages);
            return (
              <>
                <RiskTable
                  risks={pageItems}
            owners={owners}
            users={users}
            currentUser={currentUser}
            onEdit={openEditModal}
            onDelete={onDeleteRisk}
            onApprove={onApproveRisk}
            onRowClick={(risk) => { setActiveTab('incidents'); openIncidentForRisk(risk); }}
            incidentCounts={(() => {
              const counts: Record<string, number> = {};
              (incidents || []).forEach(i => { counts[i.riskId] = (counts[i.riskId] || 0) + 1; });
              return counts;
            })()}
            onViewIncidents={(risk) => { setHistoryRiskId(risk.id); setIsRiskHistoryOpen(true); }}
            onViewRiskHistory={(risk) => { setRiskChangeId(risk.id); setIsRiskChangeOpen(true); }}
                />
                <div className="mt-3 flex items-center justify-end gap-3 text-sm">
                  <label className="flex items-center gap-1 text-base-content-muted dark:text-dark-content-muted">
                    Rows per page
                    <select
                      value={riskPageSize}
                      onChange={(e) => { setRiskPageSize(Number(e.target.value)); setRiskPage(1); }}
                      className="ml-1 rounded border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1"
                    >
                      {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <span className="text-base-content-muted dark:text-dark-content-muted">Page {riskPage} of {totalPages}</span>
                  <button disabled={riskPage<=1} onClick={() => setRiskPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
                  <button disabled={riskPage>=totalPages} onClick={() => setRiskPage(p => Math.min(totalPages, p+1))} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
                </div>
              </>
            );
          })()}
          <div className="mt-2 text-xs text-base-content-muted dark:text-dark-content-muted">Tip: Click a risk row to add an incident.</div>
        </div>
      ) : activeTab === 'new' ? (
        <div className="mt-8">
          {/* Filters (status fixed to New; identification still applies) */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Identification</label>
              <select
                value={identificationFilter}
                onChange={(e) => setIdentificationFilter(e.target.value)}
                className="rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content"
              >
                {['All','Inherent risk','Residual risk'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          {(() => {
            let base = risks.filter(r => r.status === 'New');
            if (currentUser?.role === 'admin' && adminDept && adminDept !== 'All') {
              base = base.filter(r => String(r.department || '') === adminDept);
            }
            const filtered = base.filter(r => (identificationFilter==='All' || (r as any).identification === identificationFilter));
            const total = filtered.length;
            const start = (newRiskPage - 1) * riskPageSize;
            const pageItems = filtered.slice(start, start + riskPageSize);
            const totalPages = Math.max(1, Math.ceil(total / riskPageSize));
            if (newRiskPage > totalPages) setNewRiskPage(totalPages);
            return (
              <>
                <RiskTable
                  risks={pageItems}
            owners={owners}
            users={users}
            currentUser={currentUser}
            onEdit={openEditModal}
            onDelete={onDeleteRisk}
            onApprove={onApproveRisk}
            onRowClick={(risk) => { setActiveTab('incidents'); openIncidentForRisk(risk); }}
            incidentCounts={(() => {
              const counts: Record<string, number> = {};
              (incidents || []).forEach(i => { counts[i.riskId] = (counts[i.riskId] || 0) + 1; });
              return counts;
            })()}
            onViewIncidents={(risk) => { setHistoryRiskId(risk.id); setIsRiskHistoryOpen(true); }}
            onViewRiskHistory={(risk) => { setRiskChangeId(risk.id); setIsRiskChangeOpen(true); }}
                />
                <div className="mt-3 flex items-center justify-end gap-3 text-sm">
                  <label className="flex items-center gap-1 text-base-content-muted dark:text-dark-content-muted">
                    Rows per page
                    <select
                      value={riskPageSize}
                      onChange={(e) => { setRiskPageSize(Number(e.target.value)); setNewRiskPage(1); }}
                      className="ml-1 rounded border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1"
                    >
                      {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <span className="text-base-content-muted dark:text-dark-content-muted">Page {newRiskPage} of {totalPages}</span>
                  <button disabled={newRiskPage<=1} onClick={() => setNewRiskPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
                  <button disabled={newRiskPage>=totalPages} onClick={() => setNewRiskPage(p => Math.min(totalPages, p+1))} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
                </div>
              </>
            );
          })()}
          <div className="mt-2 text-xs text-base-content-muted dark:text-dark-content-muted">Showing risks with Status = New.</div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content">AI-Powered Summary for Incidents</h3>
            <div className="mt-2 text-sm text-base-content-muted dark:text-dark-content-muted">
              {aiIncidentsSummary ? <pre className="whitespace-pre-wrap">{aiIncidentsSummary}</pre> : <p>Click the button to generate an incidents summary grouped by risk.</p>}
              {aiIncidentsLoading && <p className="animate-pulse">Generating incidents summary...</p>}
            </div>
            <div className="mt-4">
              <button
                onClick={() => onRefreshIncidentsSummary && onRefreshIncidentsSummary()}
                disabled={!!aiIncidentsLoading || incidents.length === 0}
                className="rounded-md bg-brand-primary/20 px-3 py-2 text-sm font-semibold text-brand-primary shadow-sm hover:bg-brand-primary/30 disabled:opacity-50"
              >
                {aiIncidentsLoading ? 'Generating...' : 'Generate Incidents Summary'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-base-content dark:text-dark-content">Incidents</h3>
            {(currentUser?.role === 'manager' || currentUser?.role === 'user') && (
              <button
                type="button"
                onClick={() => { setIsAddingIncident(true); setEditingIncident(null); setIncidentRiskId(undefined); setActiveTab('incidents'); }}
                className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90"
              >
                Add Incident
              </button>
            )}
          </div>
          {(currentUser?.role === 'manager' || currentUser?.role === 'user') && (isAddingIncident || incidentRiskId || editingIncident) && (
            <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content mb-4">{editingIncident ? 'Edit Incident' : 'Add Incident'}</h3>
              <IncidentForm
                risks={risks}
                riskId={incidentRiskId}
                incident={editingIncident || undefined}
                onSave={(payload) => {
                  if ((payload as any).id) {
                    onUpdateIncident && onUpdateIncident(payload as Incident);
                  } else {
                    onAddIncident && onAddIncident(payload as any);
                  }
                  setEditingIncident(null);
                  setIncidentRiskId(undefined);
                  setIsAddingIncident(false);
                }}
                onCancel={() => { setEditingIncident(null); setIncidentRiskId(undefined); setIsAddingIncident(false); }}
              />
            </div>
          )}
          {(() => {
            let list = incidents;
            if (currentUser) {
              if (currentUser.role === 'admin') {
                // Admin filter incidents by dept via related risks
                let allowed = risks;
                if (adminDept && adminDept !== 'All') allowed = allowed.filter(r => String(r.department || '') === adminDept);
                const allowedIds = new Set(allowed.map(r => r.id));
                list = list.filter(i => allowedIds.has(i.riskId));
              } else if (currentUser.role === 'user') {
                list = incidents.filter(i => i.createdByUserId === currentUser.id);
              } else if (currentUser.role === 'manager' && currentUser.department) {
                const allowedRiskIds = risks.filter(r => r.department === currentUser.department || owners.find(o => o.id === r.ownerId)?.department === currentUser.department).map(r => r.id);
                list = incidents.filter(i => allowedRiskIds.includes(i.riskId));
              }
            }
            const total = list.length;
            const start = (incPage - 1) * incPageSize;
            const pageItems = list.slice(start, start + incPageSize);
            const totalPages = Math.max(1, Math.ceil(total / incPageSize));
            if (incPage > totalPages) setIncPage(totalPages);
            return (
              <>
                <IncidentsTable
                  incidents={pageItems}
                  risks={risks}
                  currentUser={currentUser}
                  onEdit={(inc) => { setEditingIncident(inc); setIncidentRiskId(inc.riskId); }}
                  onClickIncident={(inc) => openIncidentHistory(inc.id)}
                />
                <div className="mt-3 flex items-center justify-end gap-3 text-sm">
                  <label className="flex items-center gap-1 text-base-content-muted dark:text-dark-content-muted">
                    Rows per page
                    <select
                      value={incPageSize}
                      onChange={(e) => { setIncPageSize(Number(e.target.value)); setIncPage(1); }}
                      className="ml-1 rounded border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1"
                    >
                      {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <span className="text-base-content-muted dark:text-dark-content-muted">Page {incPage} of {totalPages}</span>
                  <button disabled={incPage<=1} onClick={() => setIncPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
                  <button disabled={incPage>=totalPages} onClick={() => setIncPage(p => Math.min(totalPages, p+1))} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <RiskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRisk}
        riskToEdit={riskToEdit}
        owners={owners}
      />

      {/* Inline incident form replaces modal */}

      <IncidentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={incidentHistory.filter(h => h.incidentId === historyForIncidentId)}
      />

      <RiskIncidentHistoryModal
        isOpen={isRiskHistoryOpen}
        onClose={() => setIsRiskHistoryOpen(false)}
        risk={risks.find(r => r.id === historyRiskId) || null}
        incidents={incidents.filter(i => i.riskId === historyRiskId)}
      />
      <RiskChangeHistoryModal
        isOpen={isRiskChangeOpen}
        onClose={() => setIsRiskChangeOpen(false)}
        risk={risks.find(r => r.id === riskChangeId) || null}
      />

      {/* KPI Modal: List risks by impact */}
      <Modal
        isOpen={isKpiModalOpen}
        onClose={() => setIsKpiModalOpen(false)}
        title={`${kpiImpactFilter || ''}${kpiLikelihoodFilter ? ' × ' + kpiLikelihoodFilter : ''} Risks`}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full table-auto divide-y divide-base-300 dark:divide-dark-300">
            <thead>
              <tr className="bg-brand-secondary">
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Risk ID</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Category</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Description</th>
                {currentUser?.role === 'admin' && (
                  <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Department</th>
                )}
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Identification</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Created</th>
                <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300 dark:divide-dark-300">
              {risks
                .filter(r => (!kpiImpactFilter || r.impact === kpiImpactFilter) && (!kpiLikelihoodFilter || r.likelihood === kpiLikelihoodFilter))
                .map(r => (
                  <tr key={r.id} className="hover:bg-base-100 dark:hover:bg-dark-100">
                    <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{r.riskNo || r.id}</td>
                    <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{r.category || '-'}</td>
                    <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{r.description}</td>
                    {currentUser?.role === 'admin' && (
                      <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{r.department || '-'}</td>
                    )}
                    <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{(r as any).identification || '-'}</td>
                    <td className="px-3 py-2 text-sm text-base-content-muted dark:text-dark-content-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-sm text-base-content-muted dark:text-dark-content-muted">{new Date(r.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              {risks.filter(r => (!kpiImpactFilter || r.impact === kpiImpactFilter) && (!kpiLikelihoodFilter || r.likelihood === kpiLikelihoodFilter)).length === 0 && (
                <tr>
                  <td colSpan={currentUser?.role === 'admin' ? 7 : 6} className="text-center py-6 text-base-content-muted dark:text-dark-content-muted">No risks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default RiskDashboard;