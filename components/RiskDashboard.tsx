import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Risk, Owner, User, Incident, IncidentHistory, RiskLikelihood, RiskImpact } from '../types';
import RiskTable from './RiskTable';
import RiskFormModal from './RiskFormModal';
import { PlusIcon } from '../constants';
import RiskMatrix, { normalizeImpact, normalizeLikelihood } from './RiskMatrix';
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
  onRejectRisk?: (risk: Risk, reason: string) => void;
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
  // Manager/User department filters
  managerDeptOptions?: string[];
  managerDept?: string;
  onChangeManagerDept?: (v: string) => void;
  userDeptOptions?: string[];
  userDept?: string;
  onChangeUserDept?: (v: string) => void;
  // Edit status for user's risk edits
  editStatuses?: Record<string, any>;
  // Pending edit approvals (for manager/admin in Pending Action tab)
  pendingEdits?: any[];
  onRefreshPendingEdits?: () => void;
  onApproveEdit?: (riskId: string, historyId: number) => Promise<void>;
  onRejectEdit?: (riskId: string, rejectionReason?: string) => Promise<void>;
  // Pending incidents (new + edits) for manager/admin
  pendingNewIncidents?: any[];
  pendingIncidentEdits?: any[];
  onApproveIncident?: (incidentId: string) => Promise<void>;
  onRejectIncident?: (incidentId: string, rejectionReason?: string) => Promise<void>;
  onApproveIncidentEdit?: (incidentId: string, historyId: number) => Promise<void>;
  onRejectIncidentEdit?: (incidentId: string, rejectionReason?: string) => Promise<void>;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({ risks, owners, users, currentUser, onSaveRisk, onDeleteRisk, onApproveRisk, onRejectRisk, incidents = [], incidentHistory = [], onAddIncident, onUpdateIncident, aiSummary, aiLoading, onRefreshSummary, aiIncidentsSummary, aiIncidentsLoading, onRefreshIncidentsSummary, onSetSummaryRiskId, adminDeptOptions = [], adminDept = 'All', onChangeAdminDept, managerDeptOptions = [], managerDept = 'All', onChangeManagerDept, userDeptOptions = [], userDept = 'All', onChangeUserDept, editStatuses = {}, pendingEdits = [], onRefreshPendingEdits, onApproveEdit, onRejectEdit, pendingNewIncidents = [], pendingIncidentEdits = [], onApproveIncident, onRejectIncident, onApproveIncidentEdit, onRejectIncidentEdit }) => {
  // Debug logging
  // Derive effective department options (fallback to assignedDepartments if needed)
  const effectiveManagerDepts = React.useMemo(() => {
    if (managerDeptOptions && managerDeptOptions.length >= 2) return managerDeptOptions;
    if (currentUser?.role === 'manager' && currentUser?.assignedDepartments?.length >= 2) {
      return ['All', ...currentUser.assignedDepartments];
    }
    return managerDeptOptions || [];
  }, [managerDeptOptions, currentUser]);

  const effectiveUserDepts = React.useMemo(() => {
    if (userDeptOptions && userDeptOptions.length >= 2) return userDeptOptions;
    if (currentUser?.role === 'user' && currentUser?.assignedDepartments?.length >= 2) {
      return ['All', ...currentUser.assignedDepartments];
    }
    return userDeptOptions || [];
  }, [userDeptOptions, currentUser]);

  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('RiskDashboard - currentUser role:', currentUser?.role, 'managerDeptOptions:', managerDeptOptions, 'length:', managerDeptOptions.length, 'userDeptOptions:', userDeptOptions, 'length:', userDeptOptions.length);
    // eslint-disable-next-line no-console
    console.log('RiskDashboard - Effective manager options length:', effectiveManagerDepts.length, 'Effective user options length:', effectiveUserDepts.length);
  }, [currentUser, managerDeptOptions, userDeptOptions, effectiveManagerDepts, effectiveUserDepts]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riskToEdit, setRiskToEdit] = useState<Risk | null>(null);
  const summary = aiSummary || '';
  const isGeneratingSummary = !!aiLoading;
  const [isRiskHistoryOpen, setIsRiskHistoryOpen] = useState(false);
  const [historyRiskId, setHistoryRiskId] = useState<string | null>(null);
  const [isRiskChangeOpen, setIsRiskChangeOpen] = useState(false);
  const [riskChangeId, setRiskChangeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'risks' | 'new' | 'incidents' | 'pending' | 'rejected'>('risks');
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const tableSectionRef = useRef<HTMLDivElement | null>(null);
  // Pagination
  const [riskPage, setRiskPage] = useState<number>(1);
  const [riskPageSize, setRiskPageSize] = useState<number>(10);
  const [newRiskPage, setNewRiskPage] = useState<number>(1);
  const [incPage, setIncPage] = useState<number>(1);
  const [incPageSize, setIncPageSize] = useState<number>(10);
  const [pendingPage, setPendingPage] = useState<number>(1);
  const [rejectedPage, setRejectedPage] = useState<number>(1);
  const [rejectTarget, setRejectTarget] = useState<Risk | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectEditRiskId, setRejectEditRiskId] = useState<string | null>(null);
  const [rejectEditRiskNo, setRejectEditRiskNo] = useState<string>('');
  const [rejectEditReason, setRejectEditReason] = useState<string>('');
  const [approvingEditRiskId, setApprovingEditRiskId] = useState<string | null>(null);
  const [rejectIncidentId, setRejectIncidentId] = useState<string | null>(null);
  const [rejectIncidentReason, setRejectIncidentReason] = useState<string>('');
  const [rejectIncidentEditId, setRejectIncidentEditId] = useState<string | null>(null);
  const [rejectIncidentEditReason, setRejectIncidentEditReason] = useState<string>('');
  const [approvingIncidentId, setApprovingIncidentId] = useState<string | null>(null);
  const [approvingIncidentEditId, setApprovingIncidentEditId] = useState<string | null>(null);
  
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

  const filterInputStyles = "rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-1.5 text-sm text-base-content dark:text-dark-content";
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const matchesSearch = (risk: Risk) => {
    if (!normalizedSearch) return true;
    const haystack = [
      risk.riskNo,
      risk.description,
      risk.category,
      (risk as any).existingControlInPlace,
      (risk as any).planOfAction,
      (risk as any).identification,
      (risk as any).riskIndicator,
      risk.department,
      risk.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  };

  const availableDeptOptions = adminDeptOptions && adminDeptOptions.length > 0 ? adminDeptOptions : ['All'];
  const selectedAdminDept = adminDept && availableDeptOptions.includes(adminDept) ? adminDept : availableDeptOptions[0];

  useEffect(() => {
    if (['new', 'pending', 'rejected'].includes(activeTab)) {
      if (tableSectionRef.current) {
        tableSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeTab]);

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
          {activeTab !== 'incidents' && (currentUser && ['manager','admin','unit_head','user'].includes(currentUser.role)) && (
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
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('risks')} className={`px-3 py-1.5 text-sm rounded-md border shrink-0 ${activeTab==='risks'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Risks</button>
          <button onClick={() => setActiveTab('new')} className={`px-3 py-1.5 text-sm rounded-md border shrink-0 ${activeTab==='new'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>New Risks</button>
          <button onClick={() => setActiveTab('pending')} className={`px-3 py-1.5 text-sm rounded-md border relative shrink-0 ${activeTab==='pending'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>
            Pending Action
            {(() => {
              const raisedCount = risks.filter(r => String(r.status || '').toLowerCase() === 'raised').length;
              const editCount = (currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (pendingEdits?.length || 0) : 0;
              const incidentNewCount = (currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (pendingNewIncidents?.length || 0) : 0;
              const incidentEditCount = (currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (pendingIncidentEdits?.length || 0) : 0;
              const pendingCount = raisedCount + editCount + incidentNewCount + incidentEditCount;
              if (pendingCount > 0) {
                return (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {pendingCount}
                  </span>
                );
              }
              return null;
            })()}
          </button>
          <button onClick={() => setActiveTab('rejected')} className={`px-3 py-1.5 text-sm rounded-md border ${activeTab==='rejected'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Rejected Risks</button>
          <button onClick={() => setActiveTab('incidents')} className={`px-3 py-1.5 text-sm rounded-md border ${activeTab==='incidents'?'bg-brand-primary text-white border-brand-primary':'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300'}`}>Incidents</button>
        </div>
      </div>

      {activeTab !== 'incidents' && (
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
      )}

      {activeTab !== 'incidents' && showSummary && (
        <>
          {currentUser?.role === 'admin' && (
            <div className="mt-8 flex items-center gap-3">
              <label className="text-sm text-base-content dark:text-dark-content">
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
            </div>
          )}
          {currentUser?.role === 'manager' && effectiveManagerDepts.length >= 2 && (
            <div className="mt-8 flex items-center gap-3">
              <label className="text-sm text-base-content dark:text-dark-content">
                Department
                <select
                  value={managerDept}
                  onChange={(e) => onChangeManagerDept && onChangeManagerDept(e.target.value)}
                  className="ml-2 rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1.5 text-sm"
                >
                  {effectiveManagerDepts.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {currentUser?.role === 'user' && effectiveUserDepts.length >= 2 && (
            <div className="mt-8 flex items-center gap-3">
              <label className="text-sm text-base-content dark:text-dark-content">
                Department
                <select
                  value={userDept}
                  onChange={(e) => onChangeUserDept && onChangeUserDept(e.target.value)}
                  className="ml-2 rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1.5 text-sm"
                >
                  {effectiveUserDepts.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
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
        </>
      )}

      {activeTab !== 'incidents' && showMatrix && (currentUser && ['manager','admin','unit_head','user'].includes(currentUser.role)) && (
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


      <div ref={tableSectionRef}>
      {activeTab === 'risks' ? (
        <div className="mt-8">
          {/* Filters (keep on one line when space allows) */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {((currentUser?.role === 'manager' && effectiveManagerDepts.length >= 2) || 
              (currentUser?.role === 'user' && effectiveUserDepts.length >= 2)) && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-base-content dark:text-dark-content">Department</label>
                <select
                  value={currentUser?.role === 'manager' ? managerDept : userDept}
                  onChange={(e) => {
                    if (currentUser?.role === 'manager' && onChangeManagerDept) {
                      onChangeManagerDept(e.target.value);
                    } else if (currentUser?.role === 'user' && onChangeUserDept) {
                      onChangeUserDept(e.target.value);
                    }
                  }}
                  className={filterInputStyles}
                >
                  {(currentUser?.role === 'manager' ? effectiveManagerDepts : effectiveUserDepts).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            className={filterInputStyles}
              >
                {['All','New','Existing','Downgraded','Upgraded','Eliminated','Open','Closed','In Progress'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Identification</label>
              <select
                value={identificationFilter}
                onChange={(e) => setIdentificationFilter(e.target.value)}
            className={filterInputStyles}
              >
                {['All','Inherent','Residual'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content dark:text-dark-content">Department</label>
            <select
              value={selectedAdminDept}
              onChange={(e) => onChangeAdminDept && onChangeAdminDept(e.target.value)}
              className={filterInputStyles}
            >
              {availableDeptOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <label className="text-sm text-base-content dark:text-dark-content">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setRiskPage(1); setNewRiskPage(1); setPendingPage(1); setRejectedPage(1); }}
            placeholder="Search by ID, description, category..."
            className={filterInputStyles + ' flex-1'}
          />
            </div>
          </div>
          {(() => {
            // Apply admin-level dept filter first, and exclude rejected and raised risks (raised risks are shown in Pending Action tab)
            let base = risks.filter(r => String(r.status || '').toLowerCase() !== 'rejected' && String(r.status || '').toLowerCase() !== 'raised');
            if (currentUser?.role === 'admin') {
              if (adminDept && adminDept !== 'All') base = base.filter(r => String(r.department || '') === adminDept);
            }
        const filtered = base
          .filter(r => (statusFilter==='All' || r.status === statusFilter))
          .filter(r => (identificationFilter==='All' || (r as any).identification === identificationFilter))
          .filter(matchesSearch);
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
                  onReject={(risk) => { setRejectTarget(risk); setRejectReason(''); }}
            onRowClick={(risk) => { setActiveTab('incidents'); openIncidentForRisk(risk); }}
            editStatuses={editStatuses}
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
                className={filterInputStyles}
              >
                {['All','Inherent risk','Residual risk'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-base-content dark:text-dark-content">Department</label>
                <select
                  value={selectedAdminDept}
                  onChange={(e) => onChangeAdminDept && onChangeAdminDept(e.target.value)}
                  className={filterInputStyles}
                >
                  {availableDeptOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <label className="text-sm text-base-content dark:text-dark-content">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setNewRiskPage(1); }}
                placeholder="Search by ID, description, category..."
                className={filterInputStyles + ' flex-1'}
              />
            </div>
          </div>
          {(() => {
            // Show only newly created risks (exclude rejected)
            let base = risks.filter(r => r.status === 'New');
            if (currentUser?.role === 'admin' && adminDept && adminDept !== 'All') {
              base = base.filter(r => String(r.department || '') === adminDept);
            }
            const filtered = base
              .filter(r => (identificationFilter==='All' || (r as any).identification === identificationFilter))
              .filter(matchesSearch);
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
                  onReject={(risk) => { setRejectTarget(risk); setRejectReason(''); }}
            onRowClick={(risk) => { setActiveTab('incidents'); openIncidentForRisk(risk); }}
            editStatuses={editStatuses}
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
          <div className="mt-2 text-xs text-base-content-muted dark:text-dark-content-muted">
            Showing risks with Status = New.
          </div>
        </div>
      ) : activeTab === 'pending' ? (
        <div className="mt-8 space-y-8">
          {/* Pending edits (manager/admin) - edits submitted by users awaiting approval */}
          {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && pendingEdits && pendingEdits.length > 0 && (
            <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content mb-4">Pending edits</h3>
              <p className="text-sm text-base-content-muted dark:text-dark-content-muted mb-4">
                The following risks have edits submitted by users. Approve to apply changes or reject to discard.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border border-base-300 dark:border-dark-300 rounded-lg overflow-hidden">
                  <thead className="bg-brand-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Risk ID</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Description</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Department</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Changed by</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Fields</th>
                      <th className="px-3 py-2 text-right text-sm font-semibold text-brand-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                    {pendingEdits.map((pe: any) => {
                      const riskIdStr = String(pe.RiskId || pe.riskId || '');
                      const firstHistoryId = pe.pendingChanges?.[0]?.RiskHistoryId ?? pe.pendingChanges?.[0]?.riskHistoryId;
                      const isApproving = approvingEditRiskId === riskIdStr;
                      return (
                        <tr key={riskIdStr} className="bg-base-100 dark:bg-dark-100">
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content font-medium">{pe.RiskNo || pe.riskNo || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content max-w-[280px] truncate" title={pe.RiskDescription || pe.riskDescription}>{pe.RiskDescription || pe.riskDescription || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{pe.DepartmentName || pe.departmentName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{pe.ChangedByName || pe.changedByName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content-muted dark:text-dark-content-muted">{pe.ChangedFields || pe.changedFields || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={isApproving || !onApproveEdit || !firstHistoryId}
                                onClick={async () => {
                                  if (!onApproveEdit || !firstHistoryId) return;
                                  setApprovingEditRiskId(riskIdStr);
                                  try {
                                    await onApproveEdit(riskIdStr, firstHistoryId);
                                    onRefreshPendingEdits?.();
                                  } catch (e) {
                                    // Error already logged in parent
                                  } finally {
                                    setApprovingEditRiskId(null);
                                  }
                                }}
                                className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                              >
                                {isApproving ? 'Approving…' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                disabled={!onRejectEdit}
                                onClick={() => {
                                  setRejectEditRiskId(riskIdStr);
                                  setRejectEditRiskNo(pe.RiskNo || pe.riskNo || '');
                                  setRejectEditReason('');
                                }}
                                className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending new incidents (user-created, awaiting approval) */}
          {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && pendingNewIncidents && pendingNewIncidents.length > 0 && (
            <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content mb-4">Pending new incidents</h3>
              <p className="text-sm text-base-content-muted dark:text-dark-content-muted mb-4">
                New incidents submitted by users. Approve or reject.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border border-base-300 dark:border-dark-300 rounded-lg overflow-hidden">
                  <thead className="bg-brand-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Risk</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Summary</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Department</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Created by</th>
                      <th className="px-3 py-2 text-right text-sm font-semibold text-brand-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                    {pendingNewIncidents.map((inc: any) => {
                      const idStr = String(inc.IncidentId || inc.incidentId || '');
                      const isApproving = approvingIncidentId === idStr;
                      return (
                        <tr key={idStr} className="bg-base-100 dark:bg-dark-100">
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content font-medium">{inc.RiskNo || inc.riskNo || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content max-w-[240px] truncate" title={inc.Summary || inc.summary}>{inc.Summary || inc.summary || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{inc.DepartmentName || inc.departmentName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content dark:text-dark-content">{inc.CreatedByName || inc.createdByName || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button type="button" disabled={isApproving || !onApproveIncident} onClick={async () => { if (!onApproveIncident) return; setApprovingIncidentId(idStr); try { await onApproveIncident(idStr); onRefreshPendingEdits?.(); } catch (e) { } finally { setApprovingIncidentId(null); } }} className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">{isApproving ? 'Approving…' : 'Approve'}</button>
                              <button type="button" disabled={!onRejectIncident} onClick={() => { setRejectIncidentId(idStr); setRejectIncidentReason(''); }} className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">Reject</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending incident edits */}
          {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && pendingIncidentEdits && pendingIncidentEdits.length > 0 && (
            <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium leading-6 text-base-content dark:text-dark-content mb-4">Pending incident edits</h3>
              <p className="text-sm text-base-content-muted dark:text-dark-content-muted mb-4">
                Incident edits submitted by users. Approve to apply or reject to discard.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border border-base-300 dark:border-dark-300 rounded-lg overflow-hidden">
                  <thead className="bg-brand-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Risk</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Incident</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Department</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Changed by</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold text-brand-primary">Fields</th>
                      <th className="px-3 py-2 text-right text-sm font-semibold text-brand-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300 dark:divide-dark-300">
                    {pendingIncidentEdits.map((pe: any) => {
                      const incidentIdStr = String(pe.IncidentId || pe.incidentId || '');
                      const firstHistoryId = pe.pendingChanges?.[0]?.IncidentHistoryId ?? pe.pendingChanges?.[0]?.incidentHistoryId;
                      const isApproving = approvingIncidentEditId === incidentIdStr;
                      return (
                        <tr key={incidentIdStr} className="bg-base-100 dark:bg-dark-100">
                          <td className="px-3 py-2 text-sm font-medium">{pe.RiskNo || pe.riskNo || '-'}</td>
                          <td className="px-3 py-2 text-sm max-w-[220px] truncate" title={pe.IncidentSummary || pe.incidentSummary}>{pe.IncidentSummary || pe.incidentSummary || '-'}</td>
                          <td className="px-3 py-2 text-sm">{pe.DepartmentName || pe.departmentName || '-'}</td>
                          <td className="px-3 py-2 text-sm">{pe.ChangedByName || pe.changedByName || '-'}</td>
                          <td className="px-3 py-2 text-sm text-base-content-muted dark:text-dark-content-muted">{pe.ChangedFields || pe.changedFields || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button type="button" disabled={isApproving || !onApproveIncidentEdit || !firstHistoryId} onClick={async () => { if (!onApproveIncidentEdit || !firstHistoryId) return; setApprovingIncidentEditId(incidentIdStr); try { await onApproveIncidentEdit(incidentIdStr, firstHistoryId); onRefreshPendingEdits?.(); } catch (e) { } finally { setApprovingIncidentEditId(null); } }} className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">{isApproving ? 'Approving…' : 'Approve'}</button>
                              <button type="button" disabled={!onRejectIncidentEdit} onClick={() => { setRejectIncidentEditId(incidentIdStr); setRejectIncidentEditReason(''); }} className="px-3 py-1.5 text-sm rounded-md border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">Reject</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filters for pending actions (Raised risks) */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Identification</label>
              <select
                value={identificationFilter}
                onChange={(e) => setIdentificationFilter(e.target.value)}
                className={filterInputStyles}
              >
                {['All','Inherent risk','Residual risk'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-base-content dark:text-dark-content">Department</label>
                <select
                  value={selectedAdminDept}
                  onChange={(e) => onChangeAdminDept && onChangeAdminDept(e.target.value)}
                  className={filterInputStyles}
                >
                  {availableDeptOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <label className="text-sm text-base-content dark:text-dark-content">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPendingPage(1); }}
                placeholder="Search by ID, description, category..."
                className={filterInputStyles + ' flex-1'}
              />
            </div>
          </div>
          {(() => {
            // Show only risks with status 'Raised' (case-insensitive) waiting for approval/rejection
            let base = risks.filter(r => String(r.status || '').toLowerCase() === 'raised');
            if (currentUser?.role === 'admin' && adminDept && adminDept !== 'All') {
              base = base.filter(r => String(r.department || '') === adminDept);
            }
            const filtered = base
              .filter(r => (identificationFilter==='All' || (r as any).identification === identificationFilter))
              .filter(matchesSearch);
            const total = filtered.length;
            const start = (pendingPage - 1) * riskPageSize;
            const pageItems = filtered.slice(start, start + riskPageSize);
            const totalPages = Math.max(1, Math.ceil(total / riskPageSize));
            if (pendingPage > totalPages) setPendingPage(totalPages);
            const showApproveReject = currentUser?.role === 'manager' || currentUser?.role === 'admin';
            const hasOtherPending = (pendingEdits?.length || 0) + (pendingNewIncidents?.length || 0) + (pendingIncidentEdits?.length || 0) > 0;
            return (
              <>
                {total === 0 && !hasOtherPending && (
                  <p className="text-sm text-base-content-muted dark:text-dark-content-muted py-6">
                    {(currentUser?.role === 'manager' || currentUser?.role === 'admin')
                      ? 'No pending actions at the moment. New risks (Raised), user edits, and new incidents will appear here for approval.'
                      : 'You have no risks awaiting approval. Risks you submit appear here until a manager approves them.'}
                  </p>
                )}
                {total > 0 && (
                  <>
                    <RiskTable
                      risks={pageItems}
                      owners={owners}
                      users={users}
                      currentUser={currentUser}
                      onEdit={openEditModal}
                      onDelete={onDeleteRisk}
                      onApprove={showApproveReject ? onApproveRisk : undefined}
                      onReject={showApproveReject ? ((risk) => { setRejectTarget(risk); setRejectReason(''); }) : undefined}
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
                          onChange={(e) => { setRiskPageSize(Number(e.target.value)); setPendingPage(1); }}
                          className="ml-1 rounded border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1"
                        >
                          {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                      <span className="text-base-content-muted dark:text-dark-content-muted">Page {pendingPage} of {totalPages}</span>
                      <button disabled={pendingPage<=1} onClick={() => setPendingPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
                      <button disabled={pendingPage>=totalPages} onClick={() => setPendingPage(p => Math.min(totalPages, p+1))} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
                    </div>
                  </>
                )}
                <div className="mt-2 text-xs text-base-content-muted dark:text-dark-content-muted">
                  Showing risks with Status = Raised (new risks){currentUser?.role === 'manager' || currentUser?.role === 'admin' ? ' and, above, any pending edits or incidents. Managers/admins can approve or reject.' : '. Your submitted risks appear here until a manager approves them.'}
                </div>
              </>
            );
          })()}
        </div>
      ) : activeTab === 'rejected' ? (
        <div className="mt-8">
          {/* Filters for rejected risks */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-base-content dark:text-dark-content">Identification</label>
              <select
                value={identificationFilter}
                onChange={(e) => setIdentificationFilter(e.target.value)}
                className={filterInputStyles}
              >
                {['All','Inherent risk','Residual risk'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-base-content dark:text-dark-content">Department</label>
                <select
                  value={selectedAdminDept}
                  onChange={(e) => onChangeAdminDept && onChangeAdminDept(e.target.value)}
                  className={filterInputStyles}
                >
                  {availableDeptOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <label className="text-sm text-base-content dark:text-dark-content">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setRejectedPage(1); }}
                placeholder="Search by ID, description, category..."
                className={filterInputStyles + ' flex-1'}
              />
            </div>
          </div>
          {(() => {
            // Show only risks with status 'Rejected' along with their rejection reasons
            let base = risks.filter(r => r.status === 'Rejected');
            if (currentUser?.role === 'admin' && adminDept && adminDept !== 'All') {
              base = base.filter(r => String(r.department || '') === adminDept);
            }
            const filtered = base
              .filter(r => (identificationFilter==='All' || (r as any).identification === identificationFilter))
              .filter(matchesSearch);
            const total = filtered.length;
            const start = (rejectedPage - 1) * riskPageSize;
            const pageItems = filtered.slice(start, start + riskPageSize);
            const totalPages = Math.max(1, Math.ceil(total / riskPageSize));
            if (rejectedPage > totalPages) setRejectedPage(totalPages);
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
                  onReject={(risk) => { setRejectTarget(risk); setRejectReason(''); }}
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
                      onChange={(e) => { setRiskPageSize(Number(e.target.value)); setRejectedPage(1); }}
                      className="ml-1 rounded border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-2 py-1"
                    >
                      {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <span className="text-base-content-muted dark:text-dark-content-muted">Page {rejectedPage} of {totalPages}</span>
                  <button disabled={rejectedPage<=1} onClick={() => setRejectedPage(p => Math.max(1, p-1))} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
                  <button disabled={rejectedPage>=totalPages} onClick={() => setRejectedPage(p => Math.min(totalPages, p+1))} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
                </div>
                <div className="mt-2 text-xs text-base-content-muted dark:text-dark-content-muted">
                  Showing all rejected risks with their rejection reasons.
                </div>
              </>
            );
          })()}
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
                onSave={async (payload) => {
                  try {
                    if ((payload as any).id) {
                      onUpdateIncident && onUpdateIncident(payload as Incident);
                    } else {
                      onAddIncident && await onAddIncident(payload as any);
                    }
                    setEditingIncident(null);
                    setIncidentRiskId(undefined);
                    setIsAddingIncident(false);
                  } catch (e) {
                    // eslint-disable-next-line no-alert
                    alert((e as Error)?.message || 'Failed to save incident');
                  }
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
      </div>

      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
        title="Reject Risk"
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content dark:text-dark-content">
            Please provide a reason for rejecting the risk <strong>{rejectTarget?.riskNo || rejectTarget?.name}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-base-content dark:text-dark-content mb-1">Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-2 text-sm text-base-content dark:text-dark-content focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Explain why this risk is being rejected..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setRejectTarget(null); setRejectReason(''); }}
              className="px-3 py-2 text-sm rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 hover:bg-base-200 dark:hover:bg-dark-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!rejectReason.trim()}
              onClick={() => {
                if (rejectTarget && onRejectRisk) {
                  onRejectRisk(rejectTarget, rejectReason.trim());
                }
                setRejectTarget(null);
                setRejectReason('');
              }}
              className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
            >
              Reject Risk
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(rejectEditRiskId)}
        onClose={() => { setRejectEditRiskId(null); setRejectEditRiskNo(''); setRejectEditReason(''); }}
        title="Reject edit"
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content dark:text-dark-content">
            Optionally provide a reason for rejecting the edit for risk <strong>{rejectEditRiskNo}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-base-content dark:text-dark-content mb-1">Reason (optional)</label>
            <textarea
              value={rejectEditReason}
              onChange={(e) => setRejectEditReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-2 text-sm text-base-content dark:text-dark-content focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Reason for rejecting this edit..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setRejectEditRiskId(null); setRejectEditRiskNo(''); setRejectEditReason(''); }}
              className="px-3 py-2 text-sm rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 hover:bg-base-200 dark:hover:bg-dark-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (rejectEditRiskId && onRejectEdit) {
                  await onRejectEdit(rejectEditRiskId, rejectEditReason.trim() || undefined);
                  onRefreshPendingEdits?.();
                }
                setRejectEditRiskId(null);
                setRejectEditRiskNo('');
                setRejectEditReason('');
              }}
              className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500"
            >
              Reject edit
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(rejectIncidentId)} onClose={() => { setRejectIncidentId(null); setRejectIncidentReason(''); }} title="Reject new incident">
        <div className="space-y-4">
          <p className="text-sm text-base-content dark:text-dark-content">Optionally provide a reason for rejecting this incident.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <textarea value={rejectIncidentReason} onChange={(e) => setRejectIncidentReason(e.target.value)} rows={3} className="w-full rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-2 text-sm" placeholder="Reason for rejection..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setRejectIncidentId(null); setRejectIncidentReason(''); }} className="px-3 py-2 text-sm rounded-md border border-base-300 dark:border-dark-300">Cancel</button>
            <button type="button" onClick={async () => { if (rejectIncidentId && onRejectIncident) { await onRejectIncident(rejectIncidentId, rejectIncidentReason.trim() || undefined); onRefreshPendingEdits?.(); } setRejectIncidentId(null); setRejectIncidentReason(''); }} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500">Reject incident</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(rejectIncidentEditId)} onClose={() => { setRejectIncidentEditId(null); setRejectIncidentEditReason(''); }} title="Reject incident edit">
        <div className="space-y-4">
          <p className="text-sm text-base-content dark:text-dark-content">Optionally provide a reason for rejecting this incident edit.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <textarea value={rejectIncidentEditReason} onChange={(e) => setRejectIncidentEditReason(e.target.value)} rows={3} className="w-full rounded-md border border-base-300 dark:border-dark-300 bg-base-100 dark:bg-dark-100 px-3 py-2 text-sm" placeholder="Reason for rejection..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setRejectIncidentEditId(null); setRejectIncidentEditReason(''); }} className="px-3 py-2 text-sm rounded-md border border-base-300 dark:border-dark-300">Cancel</button>
            <button type="button" onClick={async () => { if (rejectIncidentEditId && onRejectIncidentEdit) { await onRejectIncidentEdit(rejectIncidentEditId, rejectIncidentEditReason.trim() || undefined); onRefreshPendingEdits?.(); } setRejectIncidentEditId(null); setRejectIncidentEditReason(''); }} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-500">Reject edit</button>
          </div>
        </div>
      </Modal>

      <RiskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRisk}
        riskToEdit={riskToEdit}
        owners={owners}
        currentUser={currentUser}
        userDeptOptions={userDeptOptions}
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
                .filter(r => {
                  const normalizedRiskImpact = normalizeImpact(r.impact);
                  const normalizedRiskLikelihood = normalizeLikelihood(r.likelihood);
                  const matchesImpact = !kpiImpactFilter || normalizedRiskImpact === kpiImpactFilter;
                  const matchesLikelihood = !kpiLikelihoodFilter || normalizedRiskLikelihood === kpiLikelihoodFilter;
                  return matchesImpact && matchesLikelihood;
                })
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
              {risks.filter(r => {
                const normalizedRiskImpact = normalizeImpact(r.impact);
                const normalizedRiskLikelihood = normalizeLikelihood(r.likelihood);
                const matchesImpact = !kpiImpactFilter || normalizedRiskImpact === kpiImpactFilter;
                const matchesLikelihood = !kpiLikelihoodFilter || normalizedRiskLikelihood === kpiLikelihoodFilter;
                return matchesImpact && matchesLikelihood;
              }).length === 0 && (
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