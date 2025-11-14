import React, { useState, useEffect, useRef } from 'react';
import { Risk, Owner, User, Incident, IncidentHistory } from './types';
import { initialRisks, initialOwners, initialUsers } from './data';
import RiskDashboard from './components/RiskDashboard';
import ReportsDashboard from './components/ReportsDashboard';
import AdminDashboard from './components/AdminDashboard';
import ThemeToggle from './components/ThemeToggle';
import UserSwitcher from './components/UserSwitcher';
import Login from './components/Login';
import { API_BASE_URL, apiUrl } from './api';

const App: React.FC = () => {
    // State management with localStorage persistence
    const [risks, setRisks] = useState<Risk[]>(() => {
        const saved = localStorage.getItem('risks');
        return saved ? JSON.parse(saved) : initialRisks;
    });
    const [owners, setOwners] = useState<Owner[]>(() => {
        const saved = localStorage.getItem('owners');
        return saved ? JSON.parse(saved) : initialOwners;
    });
    const [users, setUsers] = useState<User[]>(() => {
        const saved = localStorage.getItem('users');
        return saved ? JSON.parse(saved) : initialUsers;
    });
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const savedId = localStorage.getItem('currentUserId');
        if (!savedId) return null;
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const foundUser = allUsers.find((u: User) => u.id === savedId);
        return foundUser || null;
    });
    const [adminView, setAdminView] = useState<'risks' | 'admin' | 'reports'>('risks');
    const [managerView, setManagerView] = useState<'risks' | 'reports'>('risks');
    const [allRisks, setAllRisks] = useState<Risk[]>([]);
    const [adminDept, setAdminDept] = useState<string>('');
    const [adminDeptOptions, setAdminDeptOptions] = useState<string[]>([]);
    const [adminStatus, setAdminStatus] = useState<'Open' | 'Closed' | 'All'>('All');
    const [incidents, setIncidents] = useState<Incident[]>(() => {
        const saved = localStorage.getItem('incidents');
        return saved ? JSON.parse(saved) : [];
    });
    const [incidentHistory, setIncidentHistory] = useState<IncidentHistory[]>(() => {
        const saved = localStorage.getItem('incidentHistory');
        return saved ? JSON.parse(saved) : [];
    });
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [aiIncidentsSummary, setAiIncidentsSummary] = useState<string>('');
    const [aiIncidentsLoading, setAiIncidentsLoading] = useState<boolean>(false);
    const hasAppliedStatusAging = useRef<boolean>(false);
    const [summaryRiskId, setSummaryRiskId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('risks', JSON.stringify(risks));
    }, [risks]);

    useEffect(() => {
        localStorage.setItem('owners', JSON.stringify(owners));
    }, [owners]);
     
    useEffect(() => {
        localStorage.setItem('users', JSON.stringify(users));
        // If current user is deleted, default to first user
        if (currentUser && !users.find(u => u.id === currentUser.id)) {
            handleUserChange(users[0]?.id || '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users]);

    useEffect(() => {
        localStorage.setItem('incidents', JSON.stringify(incidents));
    }, [incidents]);

    useEffect(() => {
        localStorage.setItem('incidentHistory', JSON.stringify(incidentHistory));
    }, [incidentHistory]);



    useEffect(() => {
        if(currentUser) {
            localStorage.setItem('currentUserId', currentUser.id);
            // Load risks from API and scope by role/department
            (async () => {
                try {
                    const res = await fetch(apiUrl('/risks'));
                    const data = await res.json();
                    // Debug: log API response for verification
                    // eslint-disable-next-line no-console
                    console.log('Risks API raw response', data);
                    if (Array.isArray(data)) {
                        // Map API to local Risk type if fields align
                            const mapped = data.map((r: any) => ({
                            id: r.RiskId || r.id,
                            riskNo: r.RiskNo || r.riskNo,
                            name: r.Name || r.name,
                            description: r.Description || r.description,
                            impact: r.Impact || r.impact,
                            likelihood: r.Likelihood || r.likelihood,
                            status: r.Status || r.status,
                            ownerId: r.OwnerId || r.ownerId || owners[0]?.id || '',
                            createdByUserId: r.CreatedByUserId || r.createdByUserId,
                            raisedByName: r.CreatedByName || r.createdByName || undefined,
                            createdAt: r.CreatedAtUtc || r.createdAt || new Date().toISOString(),
                            updatedAt: r.UpdatedAtUtc || r.updatedAt || new Date().toISOString(),
                            category: r.Category || r.category || undefined,
                            subcategory: undefined,
                            existingControlInPlace: r.ExistingControlInPlace || r.existingControlInPlace || '',
                                identification: r.Identification || r.identification || undefined,
                            planOfAction: r.PlanOfAction || r.planOfAction || '',
                            classificationStatus: r.ClassificationStatus || r.classificationStatus || undefined,
                            department: r.Department || r.department || undefined,
                        }));
                        // eslint-disable-next-line no-console
                        console.log('Risks mapped (first 5)', mapped.slice(0,5).map((x:any)=>({riskNo:x.riskNo, identification:x.identification, status:x.status, dept:x.department})));
                        // Role-based scoping for user onboarding view
                        if (currentUser.role === 'user' && currentUser.department) {
                            setRisks(mapped.filter((r: any) => String(r.department || '').toLowerCase() === String(currentUser.department).toLowerCase()));
                        } else if (currentUser.role === 'manager' && currentUser.department) {
                            setRisks(mapped.filter((r: any) => String(r.department || '').toLowerCase() === String(currentUser.department).toLowerCase()));
                        } else if (currentUser.role === 'admin') {
                            const open = (mapped as any[]).filter(r => String(r.status).toLowerCase() !== 'eliminated');
                            const closed = (mapped as any[]).filter(r => String(r.status).toLowerCase() === 'eliminated');
                            setAllRisks(mapped as any);
                            const allDepts = Array.from(new Set((mapped as any[]).map(r => (r.department || '').toString()).filter(Boolean))) as string[];
                            const opts = ['All', ...allDepts];
                            setAdminDeptOptions(opts);
                            const effDept = adminDept && opts.includes(adminDept) ? adminDept : (opts[0] || 'All');
                            if (!adminDept && effDept) setAdminDept(effDept);
                            const base = adminStatus === 'Open' ? open : (adminStatus === 'Closed' ? closed : ([...open, ...closed] as any[]));
                            const filtered = effDept && effDept !== 'All' ? base.filter(r => String(r.department || '').toLowerCase() === effDept.toLowerCase()) : base;
                            setRisks(filtered as any);
                        } else {
                            setRisks(mapped);
                        }
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to load risks from API', e);
                    // ignore API failure, keep local state
                }
            })();

            // Load incidents from API based on role/department selection
            (async () => {
                try {
                    const params = new URLSearchParams();
                    if (currentUser.role === 'user') {
                        params.set('createdBy', currentUser.id);
                    } else if (currentUser.role === 'manager' && currentUser.department) {
                        params.set('department', currentUser.department);
                    } else if (currentUser.role === 'admin') {
                        if (adminDept && adminDept !== 'All') params.set('department', adminDept);
                    }
                    // Prefer department scope so user sees incidents for their department risks
                    const url = `${API_BASE_URL}/incidents${params.toString() ? `?${params.toString()}` : ''}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    // eslint-disable-next-line no-console
                    console.log('Incidents API response', data);
                    if (Array.isArray(data)) {
                        const mapped = data.map((i: any) => ({
                            id: i.IncidentId || i.id,
                            riskId: i.RiskId || i.riskId,
                            summary: i.Summary || i.summary,
                            occurredAt: i.OccurredAtUtc || i.occurredAt,
                            description: i.Description || i.description,
                            mitigationSteps: i.MitigationSteps || i.mitigationSteps,
                            currentStatusText: i.CurrentStatusText || i.currentStatusText,
                            closedDate: i.ClosedDateUtc || i.closedDate || null,
                            createdByUserId: i.CreatedByUserId || i.createdByUserId,
                            department: i.Department || i.department,
                            createdAt: i.CreatedAtUtc || i.createdAt || new Date().toISOString(),
                            updatedAt: i.UpdatedAtUtc || i.updatedAt || new Date().toISOString(),
                        }));
                        // Do not restrict here; filtering is applied when passing incidents to views
                        setIncidents(mapped as any);
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to load incidents from API', e);
                }
            })();
        }
    }, [currentUser, adminDept, adminStatus]);

    // Recompute admin risk filter when adminDept changes or allRisks update
    useEffect(() => {
        if (currentUser?.role !== 'admin') return;
        const open = allRisks.filter(r => String(r.status).toLowerCase() !== 'eliminated');
        const closed = allRisks.filter(r => String(r.status).toLowerCase() === 'eliminated');
        const allDepts = Array.from(new Set(allRisks.map(r => (r.department || '').toString()).filter(Boolean)));
        const opts = ['All', ...allDepts];
        setAdminDeptOptions(opts);
        const effDept = adminDept && opts.includes(adminDept) ? adminDept : (opts[0] || 'All');
        if (!adminDept && effDept) setAdminDept(effDept);
        const base = adminStatus === 'Open' ? open : (adminStatus === 'Closed' ? closed : [...open, ...closed]);
        const filtered = effDept && effDept !== 'All' ? base.filter(r => String(r.department || '').toLowerCase() === effDept.toLowerCase()) : base;
        setRisks(filtered);
    }, [currentUser, adminDept, adminStatus, allRisks]);

    // Migrate existing risks from older schema (level -> impact, add likelihood default)
    useEffect(() => {
        const hasLegacy = risks.some((r: any) => !r.impact || !r.likelihood || r.level);
        if (!hasLegacy) return;
        const mapLevelToImpact = (level?: string): any => {
            switch (level) {
                case 'Critical': return 'Severe';
                case 'High': return 'Significant';
                case 'Medium': return 'Moderate';
                case 'Low': return 'Minor';
                default: return 'Moderate';
            }
        };
        const migrated = risks.map((r: any) => ({
            ...r,
            impact: r.impact || mapLevelToImpact(r.level),
            likelihood: r.likelihood || 'Possible',
        }));
        setRisks(migrated as any);
    // we only want to run when risks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [/* risks */]);

    // Auto-advance old risks to 'Existing' once per session (created > 30 days)
    useEffect(() => {
        if (hasAppliedStatusAging.current || risks.length === 0) return;
        const now = Date.now();
        let changed = false;
        const updated = risks.map((r) => {
            const created = new Date(r.createdAt).getTime();
            const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            if (Number.isFinite(ageDays) && ageDays > 30 && r.status !== 'Existing' && r.status !== 'Eliminated') {
                changed = true;
                return { ...r, status: 'Existing', updatedAt: new Date().toISOString() } as typeof r;
            }
            return r;
        });
        if (changed) setRisks(updated as any);
        hasAppliedStatusAging.current = true;
    }, [risks]);

    // One-time seeding/merge to ensure latest sample data appears even if localStorage existed
    useEffect(() => {
        const seeded = localStorage.getItem('seedVersion');
        if (seeded) return;
        try {
            const existing = JSON.parse(localStorage.getItem('risks') || '[]');
            const byId = new Map<string, any>();
            for (const r of existing) byId.set(r.id, r);
            for (const r of initialRisks) {
                if (!byId.has(r.id)) byId.set(r.id, r);
            }
            const merged = Array.from(byId.values());
            setRisks(merged as any);
            localStorage.setItem('seedVersion', 'v2');
        } catch (e) {
            // noop
        }
    }, []);

    const handleUserChange = (userId: string) => {
        const user = users.find(u => u.id === userId);
        setCurrentUser(user || null);
    };

    const handleLoggedIn = (user: User) => {
        // Sync users from localStorage (in case login created a new user)
        const syncedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (Array.isArray(syncedUsers) && syncedUsers.length) {
            setUsers(syncedUsers);
        }
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('currentUserId');
        setCurrentUser(null);
        setAdminView('risks');
        setManagerView('risks');
    };

    // Risk CRUD
    const handleSaveRisk = async (riskData: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
        if (riskData.id) {
            // Edit -> persist to backend
            try {
                await fetch(apiUrl(`/risks/${riskData.id}`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: riskData.name,
                        description: riskData.description,
                        impact: riskData.impact,
                        likelihood: riskData.likelihood,
                        status: riskData.status,
                        identification: (riskData as any).identification,
                        existingControlInPlace: (riskData as any).existingControlInPlace,
                        planOfAction: (riskData as any).planOfAction,
                        changedByUserId: currentUser?.id,
                        // categoryId: optional mapping if you have ids; skipping here
                    })
                });
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to update risk in backend', e);
            }
            setRisks(risks.map(r => r.id === riskData.id ? { ...r, ...riskData, updatedAt: new Date().toISOString() } : r));
        } else {
            // Add
            // Determine department (ignore owner, use logged-in user's department)
            const deptFromUser = currentUser?.department;
            const department = deptFromUser || 'General';

            // Compute next risk number for this department (R001, R002, ...)
            const prefix = 'R';
            const currentMax = risks
                .filter(r => (r.department) === department)
                .map(r => {
                    const no = (r.riskNo || '').replace(/^R/i, '');
                    const parsed = parseInt(no, 10);
                    return isNaN(parsed) ? 0 : parsed;
                })
                .reduce((a, b) => Math.max(a, b), 0);
            const nextNo = String(currentMax + 1).padStart(3, '0');
            const riskNo = `${prefix}${nextNo}`;

            // Persist to backend so emails and DB stay in sync
            const payload = {
                departmentId: undefined, // resolved server-side by createdByUserId
                riskNo: undefined,       // auto-generated server-side
                name: riskData.name,
                description: riskData.description,
                impact: riskData.impact,
                likelihood: riskData.likelihood,
                // user => Raised, manager => as selected (default 'New')
                status: currentUser?.role === 'user' ? 'Raised' : riskData.status,
                ownerId: riskData.ownerId,
                createdByUserId: currentUser?.id,
                categoryId: undefined,
                identification: (riskData as any).identification,
                existingControlInPlace: (riskData as any).existingControlInPlace,
                planOfAction: (riskData as any).planOfAction,
            };
            try {
                const res = await fetch(apiUrl('/risks'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (res.ok && data?.risk) {
                    const r = data.risk;
                    const mapped: Risk = {
                        id: r.RiskId,
                        riskNo: r.RiskNo,
                        name: r.Name,
                        description: r.Description,
                        category: undefined,
                        subcategory: undefined,
                        existingControlInPlace: r.ExistingControlInPlace || '',
                        identification: r.Identification || undefined,
                        planOfAction: r.PlanOfAction || '',
                        impact: r.Impact,
                        likelihood: r.Likelihood,
                        status: r.Status,
                        ownerId: r.OwnerId || '',
                        createdByUserId: r.CreatedByUserId,
                        raisedByName: r.CreatedByName || undefined,
                        department: r.Department,
                        createdAt: r.CreatedAtUtc || new Date().toISOString(),
                        updatedAt: r.UpdatedAtUtc || new Date().toISOString(),
                    };
                    setRisks([mapped, ...risks]);
                } else {
                    // Fallback to local add if server rejects
                    const newRisk: Risk = {
                        ...riskData,
                        id: `r${Date.now()}`,
                        riskNo,
                        department,
                        createdByUserId: currentUser?.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    if (currentUser?.role === 'user') (newRisk as any).status = 'Raised';
                    setRisks([newRisk, ...risks]);
                }
            } catch {
                const newRisk: Risk = {
                    ...riskData,
                    id: `r${Date.now()}`,
                    riskNo,
                    department,
                    createdByUserId: currentUser?.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                if (currentUser?.role === 'user') (newRisk as any).status = 'Raised';
                setRisks([newRisk, ...risks]);
            }
        }
    };

    const handleDeleteRisk = async (riskId: string) => {
        if (!window.confirm('Confirm delete?')) return;
        try {
            await fetch(apiUrl(`/risks/${riskId}`), {
                method: 'DELETE'
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to delete risk in backend (proceeding to remove locally)', e);
        }
        setRisks(risks.filter(r => r.id !== riskId));
    };

    // Owner CRUD
    const handleAddOwner = (name: string, department: string) => {
        const newOwner: Owner = {
            id: `o${Date.now()}`,
            name,
            department,
        };
        setOwners([...owners, newOwner]);
    };

    const handleRemoveOwner = (ownerId: string) => {
        // Check if owner is in use
        if (risks.some(r => r.ownerId === ownerId)) {
            alert('Cannot delete owner as they are assigned to one or more risks.');
            return;
        }
        setOwners(owners.filter(o => o.id !== ownerId));
    };
    
    // User CRUD
    const handleAddUser = async (name: string, role: 'user' | 'manager' | 'admin' | 'unit_head', department?: string, email?: string, unit?: string, isUnitHead?: boolean, employeeId?: string) => {
        try {
            const res = await fetch(apiUrl('/users'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, department, email, unit, isUnitHead, employeeId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create user');
            const apiUser = data.user as any;
        const newUser: User = {
                id: apiUser.UserId,
                name: apiUser.Name,
                email: apiUser.Email || undefined,
                role: apiUser.Role,
                department: apiUser.Department || undefined,
                unit: apiUser.Unit || undefined,
                isUnitHead: Boolean(apiUser.IsUnitHead),
                employeeId: apiUser.EmployeeId || undefined,
            };
            setUsers([newUser, ...users]);
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert(String((e as any)?.message || e));
        }
    };

    const handleRemoveUser = (userId: string) => {
        if (users.length <= 1) {
            alert("Cannot remove the last user.");
            return;
        }
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleUpdateUser = async (id: string, name: string, role: 'user' | 'manager' | 'admin' | 'unit_head', department?: string, email?: string, unit?: string, isUnitHead?: boolean, employeeId?: string) => {
        try {
            const res = await fetch(apiUrl(`/users/${id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, department, email, unit, isUnitHead, employeeId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to update user');
            const apiUser = data.user as any;
            const updated: User = {
                id: apiUser.UserId,
                name: apiUser.Name,
                email: apiUser.Email || undefined,
                role: apiUser.Role,
                department: apiUser.Department || undefined,
                unit: apiUser.Unit || undefined,
                isUnitHead: Boolean(apiUser.IsUnitHead),
                employeeId: apiUser.EmployeeId || undefined,
            };
            setUsers(users.map(u => u.id === id ? updated : u));
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert(String((e as any)?.message || e));
        }
    };

    // Incident CRUD
    const handleAddIncident = async (payload: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'createdByUserId'>) => {
        try {
            const risk = risks.find(r => r.id === payload.riskId);
            const department = currentUser?.department || risk?.department || 'General';
            await fetch(apiUrl('/incidents'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    RiskId: payload.riskId,
                    Summary: payload.summary,
                    Description: payload.description,
                    MitigationSteps: payload.mitigationSteps,
                    CurrentStatusText: payload.currentStatusText,
                    OccurredAtUtc: payload.occurredAt,
                    ClosedDateUtc: payload.closedDate || null,
                    CreatedByUserId: currentUser?.id,
                    Department: department,
                })
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to create incident', e);
        }
        // Refresh incidents (simple re-fetch path)
        try {
            const params = new URLSearchParams();
            if (currentUser?.role === 'user') params.set('createdBy', currentUser.id);
            if (currentUser?.role === 'manager' && currentUser.department) params.set('department', currentUser.department);
            if (currentUser?.role === 'admin' && adminDept && adminDept !== 'All') params.set('department', adminDept);
            const url = `${API_BASE_URL}/incidents${params.toString() ? `?${params.toString()}` : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                const mapped = data.map((i: any) => ({
                    id: i.IncidentId || i.id,
                    riskId: i.RiskId || i.riskId,
                    summary: i.Summary || i.summary,
                    occurredAt: i.OccurredAtUtc || i.occurredAt,
                    description: i.Description || i.description,
                    mitigationSteps: i.MitigationSteps || i.mitigationSteps,
                    currentStatusText: i.CurrentStatusText || i.currentStatusText,
                    closedDate: i.ClosedDateUtc || i.closedDate || null,
                    createdByUserId: i.CreatedByUserId || i.createdByUserId,
                    department: i.Department || i.department,
                    createdAt: i.CreatedAtUtc || i.createdAt || new Date().toISOString(),
                    updatedAt: i.UpdatedAtUtc || i.updatedAt || new Date().toISOString(),
                }));
                setIncidents(mapped as any);
            }
        } catch {}
    };

    const handleUpdateIncident = async (updated: Incident) => {
        const previous = incidents.find(i => i.id === updated.id);
        if (!previous) return;
        const changedFields: Array<keyof Incident> = ['description','mitigationSteps','currentStatusText','closedDate','summary','occurredAt'];
        try {
            await fetch(apiUrl(`/incidents/${updated.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary: updated.summary,
                    description: updated.description,
                    mitigationSteps: updated.mitigationSteps,
                    currentStatusText: updated.currentStatusText,
                    occurredAt: updated.occurredAt,
                    closedDate: updated.closedDate || null,
                })
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to update incident', e);
        }
        const historyEntries: IncidentHistory[] = [];
        for (const field of changedFields) {
            // @ts-ignore
            if (previous[field] !== updated[field]) {
                historyEntries.push({
                    id: `ih${Date.now()}${field}`,
                    incidentId: updated.id,
                    changedAt: new Date().toISOString(),
                    changedByUserId: currentUser?.id,
                    fieldName: String(field),
                    oldValue: String((previous as any)[field] ?? ''),
                    newValue: String((updated as any)[field] ?? ''),
                });
            }
        }
        setIncidents(incidents.map(i => i.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : i));
        if (historyEntries.length) setIncidentHistory([...historyEntries, ...incidentHistory]);
    };

    return (
        <div className="bg-base-100 dark:bg-dark-100 min-h-screen font-sans">
            <header className="bg-base-200/80 dark:bg-dark-200/80 backdrop-blur-sm sticky top-0 z-20 border-b border-base-300 dark:border-dark-300">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                         <div className="flex items-center gap-3">
                             <img
                               src="/assets/images/logo.png"
                               alt="Kauvery Logo"
                               className="h-12 sm:h-14 w-auto object-contain select-none"
                               style={{ imageRendering: 'auto' }}
                               decoding="async"
                               loading="eager"
                               draggable={false}
                             />
                            <span className="text-xl font-bold text-base-content dark:text-dark-content">Kauvery Risk Register</span>
                         </div>
                        <div className="flex items-center gap-4">
                            {currentUser?.role === 'admin' && (
                                <div className="hidden sm:flex items-center gap-3 mr-2">
                                    <button
                                        onClick={() => setAdminView('risks')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            adminView === 'risks'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Risks
                                    </button>
                                    <button
                                        onClick={() => setAdminView('admin')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            adminView === 'admin'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Users
                                    </button>
                                    <button
                                        onClick={() => setAdminView('reports')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            adminView === 'reports'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Reports
                                    </button>
                                </div>
                            )}
                            {currentUser?.role === 'manager' && (
                                <div className="hidden sm:flex items-center gap-3 mr-2">
                                    <button
                                        onClick={() => setManagerView('risks')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            managerView === 'risks'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Risks
                                    </button>
                                    <button
                                        onClick={() => setManagerView('reports')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            managerView === 'reports'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Reports
                                    </button>
                                </div>
                            )}
                            <UserSwitcher users={users} currentUser={currentUser} onUserChange={handleUserChange} />
                            {/* <ThemeToggle /> */}
                            {currentUser && (
                                <button onClick={handleLogout} className="hidden sm:inline-flex px-3 py-1.5 text-sm rounded-md border bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200">
                                    Logout
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main>
                {!currentUser ? (
                    <Login users={users} onLogin={handleLoggedIn} />
                ) : currentUser.role === 'admin' ? (
                    adminView === 'admin' ? (
                    <AdminDashboard 
                        users={users}
                        onAddUser={handleAddUser}
                        onRemoveUser={handleRemoveUser}
                            onUpdateUser={handleUpdateUser}
                    />
                ) : adminView === 'reports' ? (
                    <ReportsDashboard
                        risks={allRisks.length ? allRisks : risks}
                        incidents={incidents}
                        departments={adminDeptOptions.length ? adminDeptOptions : ['All']}
                        currentUser={currentUser}
                    />
                ) : (
                    <RiskDashboard 
                        risks={risks}
                        owners={owners}
                            users={users}
                            currentUser={currentUser}
                            onSaveRisk={handleSaveRisk}
                            onDeleteRisk={handleDeleteRisk}
                            onApproveRisk={(risk) => handleSaveRisk({
                                id: risk.id,
                                name: risk.name,
                                description: risk.description,
                                category: risk.category,
                                subcategory: risk.subcategory,
                                impact: risk.impact,
                                likelihood: risk.likelihood,
                                status: 'New',
                                ownerId: risk.ownerId,
                            })}
                            incidents={incidents.filter(i => risks.some(r => r.id === i.riskId))}
                            incidentHistory={incidentHistory}
                            onAddIncident={handleAddIncident}
                            onUpdateIncident={handleUpdateIncident}
                            aiSummary={aiSummary}
                            aiLoading={aiLoading}
                            aiIncidentsSummary={aiIncidentsSummary}
                            aiIncidentsLoading={aiIncidentsLoading}
                            onSetSummaryRiskId={setSummaryRiskId}
                            adminDeptOptions={adminDeptOptions}
                            adminDept={adminDept}
                            onChangeAdminDept={setAdminDept}
                            onRefreshSummary={async () => {
                                try {
                                    const dept = currentUser.role === 'admin' ? (adminDept || 'All') : (currentUser.department || 'All');
                                    setAiLoading(true);
                                    const selectedRisks = summaryRiskId ? risks.filter(r => r.id === summaryRiskId) : risks;
                                    const selectedRiskIds = new Set(selectedRisks.map(r => r.id));
                                    const selectedIncidents = incidents.filter(i => selectedRiskIds.has(i.riskId));
                                    const res = await fetch(apiUrl('/ai/summary'), {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            role: currentUser.role,
                                            userName: (currentUser as any).name || (currentUser as any).Name || '',
                                            department: dept,
                                            risks: selectedRisks.map(r => ({
                                                riskNo: r.riskNo,
                                                name: r.name,
                                                description: r.description,
                                                impact: r.impact,
                                                likelihood: r.likelihood,
                                                status: r.status,
                                                department: r.department,
                                            })),
                                            incidents: selectedIncidents.map(i => ({
                                                riskNo: selectedRisks.find(r => r.id === i.riskId)?.riskNo,
                                                summary: i.summary,
                                                occurredAt: i.occurredAt,
                                                currentStatusText: i.currentStatusText
                                            }))
                                        })
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                        // eslint-disable-next-line no-console
                                        console.error('AI summary API error details:', data);
                                        throw new Error(data?.error || 'Failed to generate summary');
                                    }
                                    setAiSummary(String(data.summary || ''));
                                } catch (e) {
                                    // eslint-disable-next-line no-console
                                    console.error('AI summary refresh failed', e);
                                } finally {
                                    setAiLoading(false);
                                }
                            }}
                            onRefreshIncidentsSummary={async () => {
                                try {
                                    const dept = currentUser.role === 'admin' ? (adminDept || 'All') : (currentUser.department || 'All');
                                    setAiIncidentsLoading(true);
                                    const visibleIncidents = incidents.filter(i => risks.some(r => r.id === i.riskId));
                                    const res = await fetch(apiUrl('/ai/summary'), {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            role: currentUser.role,
                                            userName: (currentUser as any).name || (currentUser as any).Name || '',
                                            department: dept,
                                            risks: risks.map(r => ({
                                                riskNo: r.riskNo,
                                                name: r.name,
                                                description: r.description,
                                                impact: r.impact,
                                                likelihood: r.likelihood,
                                                status: r.status,
                                                department: r.department,
                                            })),
                                            incidents: visibleIncidents.map(i => ({
                                                riskNo: risks.find(r => r.id === i.riskId)?.riskNo,
                                                summary: i.summary,
                                                occurredAt: i.occurredAt,
                                                currentStatusText: i.currentStatusText,
                                            }))
                                        })
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                        console.error('AI incidents summary API error details:', data);
                                        throw new Error(data?.error || 'Failed to generate incidents summary');
                                    }
                                    setAiIncidentsSummary(String(data.summary || ''));
                                } catch (e) {
                                    console.error('AI incidents summary refresh failed', e);
                                } finally {
                                    setAiIncidentsLoading(false);
                                }
                            }}
                        />
                    )
                ) : (
                    (() => {
                        // Filter by role
                        if (currentUser.role === 'manager' && currentUser.department) {
                            const dept = String(currentUser.department).toLowerCase();
                            const filteredRisks = risks.filter(r => String(r.department || '').toLowerCase() === dept);
                            const filteredOwners = owners.filter(o => String(o.department || '').toLowerCase() === dept);
                            if (managerView === 'reports') {
                                const deptOptions = ['All', ...Array.from(new Set(filteredRisks.map(r => (r.department || '').toString()).filter(Boolean))) as string[]];
                                const deptIncidents = incidents.filter(i => filteredRisks.some(fr => fr.id === i.riskId));
                                return (
                                    <ReportsDashboard
                                        risks={filteredRisks}
                                        incidents={deptIncidents}
                                        departments={deptOptions}
                                        currentUser={currentUser}
                                    />
                                );
                            }
                            return (
                                <RiskDashboard 
                                    risks={filteredRisks}
                                    owners={filteredOwners}
                                    users={users}
                                    currentUser={currentUser}
                                    onSaveRisk={handleSaveRisk}
                                    onDeleteRisk={handleDeleteRisk}
                                    onApproveRisk={(risk) => handleSaveRisk({
                                        id: risk.id,
                                        name: risk.name,
                                        description: risk.description,
                                        category: risk.category,
                                        subcategory: risk.subcategory,
                                        impact: risk.impact,
                                        likelihood: risk.likelihood,
                                        status: 'New',
                                        ownerId: risk.ownerId,
                                    })}
                                    /* restrict incidents to manager's dept risks */
                                    incidents={incidents.filter(i => filteredRisks.some(fr => fr.id === i.riskId))}
                                    incidentHistory={incidentHistory}
                                    onAddIncident={handleAddIncident}
                                    onUpdateIncident={handleUpdateIncident}
                                    aiSummary={aiSummary}
                                    aiLoading={aiLoading}
                                    aiIncidentsSummary={aiIncidentsSummary}
                                    aiIncidentsLoading={aiIncidentsLoading}
                                    onSetSummaryRiskId={setSummaryRiskId}
                                    adminDeptOptions={adminDeptOptions}
                                    adminDept={adminDept}
                                    onChangeAdminDept={setAdminDept}
                                    onRefreshSummary={async () => {
                                        try {
                                            const dept = currentUser.department || 'All';
                                            setAiLoading(true);
                                            const selectedRisks = summaryRiskId ? filteredRisks.filter(r => r.id === summaryRiskId) : filteredRisks;
                                            const selectedRiskIds = new Set(selectedRisks.map(r => r.id));
                                            const selectedIncidents = incidents.filter(i => selectedRiskIds.has(i.riskId));
                                            const res = await fetch(apiUrl('/ai/summary'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: (currentUser as any).name || (currentUser as any).Name || '',
                                                    department: dept,
                                                    risks: selectedRisks.map(r => ({
                                                        riskNo: r.riskNo,
                                                        name: r.name,
                                                        description: r.description,
                                                        impact: r.impact,
                                                        likelihood: r.likelihood,
                                                        status: r.status,
                                                        department: r.department,
                                                    })),
                                                    incidents: selectedIncidents.map(i => ({
                                                        riskNo: selectedRisks.find(r => r.id === i.riskId)?.riskNo,
                                                        summary: i.summary,
                                                        occurredAt: i.occurredAt,
                                                        currentStatusText: i.currentStatusText
                                                    }))
                                                })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                // eslint-disable-next-line no-console
                                                console.error('AI summary API error details:', data);
                                                throw new Error(data?.error || 'Failed to generate summary');
                                            }
                                            setAiSummary(String(data.summary || ''));
                                        } catch (e) {
                                            // eslint-disable-next-line no-console
                                            console.error('AI summary refresh failed', e);
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                    onRefreshIncidentsSummary={async () => {
                                        try {
                                            const dept = currentUser.department || 'All';
                                            setAiIncidentsLoading(true);
                                            const visibleIncidents = incidents.filter(i => filteredRisks.some(r => r.id === i.riskId));
                                            const res = await fetch(apiUrl('/ai/summary'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: (currentUser as any).name || (currentUser as any).Name || '',
                                                    department: dept,
                                                    risks: filteredRisks.map(r => ({
                                                        riskNo: r.riskNo,
                                                        name: r.name,
                                                        description: r.description,
                                                        impact: r.impact,
                                                        likelihood: r.likelihood,
                                                        status: r.status,
                                                        department: r.department,
                                                    })),
                                                    incidents: visibleIncidents.map(i => ({
                                                        riskNo: filteredRisks.find(r => r.id === i.riskId)?.riskNo,
                                                        summary: i.summary,
                                                        occurredAt: i.occurredAt,
                                                        currentStatusText: i.currentStatusText,
                                                    }))
                                                })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                console.error('AI incidents summary API error details:', data);
                                                throw new Error(data?.error || 'Failed to generate incidents summary');
                                            }
                                            setAiIncidentsSummary(String(data.summary || ''));
                                        } catch (e) {
                                            console.error('AI incidents summary refresh failed', e);
                                        } finally {
                                            setAiIncidentsLoading(false);
                                        }
                                    }}
                                />
                            );
                        }
                        if (currentUser.role === 'user') {
                            const filtered = risks.filter(r => r.createdByUserId === currentUser.id || (currentUser.department && String(r.department || '').toLowerCase() === String(currentUser.department).toLowerCase()));
                            return (
                                <RiskDashboard 
                                    risks={filtered}
                                    owners={owners}
                                    users={users}
                                    currentUser={currentUser}
                                    onSaveRisk={handleSaveRisk}
                                    onDeleteRisk={handleDeleteRisk}
                                    incidents={incidents.filter(i => filtered.some(fr => fr.id === i.riskId))}
                                    incidentHistory={incidentHistory}
                                    onAddIncident={handleAddIncident}
                                    onUpdateIncident={handleUpdateIncident}
                                    aiSummary={aiSummary}
                                    aiLoading={aiLoading}
                                    onRefreshSummary={async () => {
                                        try {
                                            const dept = currentUser.department || 'All';
                                            setAiLoading(true);
                                            const res = await fetch('http://localhost:4000/api/ai/summary', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: (currentUser as any).name || (currentUser as any).Name || '',
                                                    department: dept,
                                                    risks: filtered.map(r => ({
                                                        riskNo: r.riskNo,
                                                        name: r.name,
                                                        description: r.description,
                                                        impact: r.impact,
                                                        likelihood: r.likelihood,
                                                        status: r.status,
                                                        department: r.department,
                                                    }))
                                                })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                // eslint-disable-next-line no-console
                                                console.error('AI summary API error details:', data);
                                                throw new Error(data?.error || 'Failed to generate summary');
                                            }
                                            setAiSummary(String(data.summary || ''));
                                        } catch (e) {
                                            // eslint-disable-next-line no-console
                                            console.error('AI summary refresh failed', e);
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                />
                            );
                        }
                        return (
                            <RiskDashboard 
                                risks={risks}
                                owners={owners}
                                users={users}
                        currentUser={currentUser}
                        onSaveRisk={handleSaveRisk}
                        onDeleteRisk={handleDeleteRisk}
                                onApproveRisk={(risk) => handleSaveRisk({
                                    id: risk.id,
                                    name: risk.name,
                                    description: risk.description,
                                    category: risk.category,
                                    subcategory: risk.subcategory,
                                    impact: risk.impact,
                                    likelihood: risk.likelihood,
                                    status: 'New',
                                    ownerId: risk.ownerId,
                                })}
                                incidents={incidents}
                                incidentHistory={incidentHistory}
                                onAddIncident={handleAddIncident}
                                onUpdateIncident={handleUpdateIncident}
                            aiSummary={aiSummary}
                            aiLoading={aiLoading}
                            aiIncidentsSummary={aiIncidentsSummary}
                            aiIncidentsLoading={aiIncidentsLoading}
                                onSetSummaryRiskId={setSummaryRiskId}
                                adminDeptOptions={adminDeptOptions}
                                adminDept={adminDept}
                                onChangeAdminDept={setAdminDept}
                                onRefreshSummary={async () => {
                                    try {
                                        const dept = currentUser.department || 'All';
                                        setAiLoading(true);
                                        const selectedRisks = summaryRiskId ? risks.filter(r => r.id === summaryRiskId) : risks;
                                        const selectedRiskIds = new Set(selectedRisks.map(r => r.id));
                                        const selectedIncidents = incidents.filter(i => selectedRiskIds.has(i.riskId));
                                        const res = await fetch(apiUrl('/ai/summary'), {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                role: currentUser.role,
                                                userName: (currentUser as any).name || (currentUser as any).Name || '',
                                                department: dept,
                                                risks: selectedRisks.map(r => ({
                                                    riskNo: r.riskNo,
                                                    name: r.name,
                                                    description: r.description,
                                                    impact: r.impact,
                                                    likelihood: r.likelihood,
                                                    status: r.status,
                                                    department: r.department,
                                                })),
                                                incidents: selectedIncidents.map(i => ({
                                                    riskNo: selectedRisks.find(r => r.id === i.riskId)?.riskNo,
                                                    summary: i.summary,
                                                    occurredAt: i.occurredAt,
                                                    currentStatusText: i.currentStatusText
                                                }))
                                            })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                            // eslint-disable-next-line no-console
                                            console.error('AI summary API error details:', data);
                                            throw new Error(data?.error || 'Failed to generate summary');
                                        }
                                        setAiSummary(String(data.summary || ''));
                                    } catch (e) {
                                        // eslint-disable-next-line no-console
                                        console.error('AI summary refresh failed', e);
                                    } finally {
                                        setAiLoading(false);
                                    }
                            }}
                            onRefreshIncidentsSummary={async () => {
                                try {
                                    const dept = currentUser.department || 'All';
                                    setAiIncidentsLoading(true);
                                    const visibleIncidents = incidents; // for this branch we passed all incidents
                                    const res = await fetch(apiUrl('/ai/summary'), {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            role: currentUser.role,
                                            userName: (currentUser as any).name || (currentUser as any).Name || '',
                                            department: dept,
                                            risks: risks.map(r => ({
                                                riskNo: r.riskNo,
                                                name: r.name,
                                                description: r.description,
                                                impact: r.impact,
                                                likelihood: r.likelihood,
                                                status: r.status,
                                                department: r.department,
                                            })),
                                            incidents: visibleIncidents.map(i => ({
                                                riskNo: risks.find(r => r.id === i.riskId)?.riskNo,
                                                summary: i.summary,
                                                occurredAt: i.occurredAt,
                                                currentStatusText: i.currentStatusText,
                                            }))
                                        })
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                        console.error('AI incidents summary API error details:', data);
                                        throw new Error(data?.error || 'Failed to generate incidents summary');
                                    }
                                    setAiIncidentsSummary(String(data.summary || ''));
                                } catch (e) {
                                    console.error('AI incidents summary refresh failed', e);
                                } finally {
                                    setAiIncidentsLoading(false);
                                }
                            }}
                            />
                        );
                    })()
                )}
            </main>
        </div>
    );
};

export default App;