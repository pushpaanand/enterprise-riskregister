import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Risk, Owner, User, Incident, IncidentHistory } from './types';
import { initialRisks, initialOwners, initialUsers } from './data';
import RiskDashboard from './components/RiskDashboard';
import ReportsDashboard from './components/ReportsDashboard';
import AdminDashboard from './components/AdminDashboard';
import ThemeToggle from './components/ThemeToggle';
import UserSwitcher from './components/UserSwitcher';
import Login from './components/Login';
import AzureStaticWebAppsLogin from './components/AzureStaticWebAppsLogin';
import { API_BASE_URL, apiUrl } from './api';

type LinkAction = {
    riskId: string;
    action: 'approve';
};

function parseLinkActionFromLocation(): LinkAction | null {
    if (typeof window === 'undefined') return null;
    try {
        const url = new URL(window.location.href);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length >= 2 && segments[0].toLowerCase() === 'risks') {
            const riskId = decodeURIComponent(segments[1]);
            const actionParam = url.searchParams.get('action');
            if (actionParam && actionParam.toLowerCase() === 'approve') {
                return { riskId, action: 'approve' };
            }
        }
    } catch {
        // ignore parse errors
    }
    return null;
}

function clearLinkActionFromUrl() {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        const basePath = url.pathname.split('/risks/')[0] || '/';
        const normalized = basePath.endsWith('/') ? basePath : `${basePath}/`;
        window.history.replaceState({}, document.title, normalized);
    } catch {
        window.history.replaceState({}, document.title, '/');
    }
}

const OPERATIONS_DEPARTMENT_ALIASES = [
    'operations',
    'operations unit',
    'operations department',
    'operations - unit',
    'operation unit',
    'operations team'
];
const DEFAULT_OPERATIONS_LABEL = 'Operations';

const isOperationsDepartment = (value?: string | null) => {
    if (!value) return false;
    const normalized = value.toString().trim().toLowerCase();
    return OPERATIONS_DEPARTMENT_ALIASES.includes(normalized);
};

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
    const [unitHeadView, setUnitHeadView] = useState<'risks' | 'reports'>('risks');
    const [userView, setUserView] = useState<'risks' | 'reports'>('risks');
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
    const [pendingLinkAction, setPendingLinkAction] = useState<LinkAction | null>(() => parseLinkActionFromLocation());
    const linkActionProcessingRef = useRef(false);
    const [azureLogoutFn, setAzureLogoutFn] = useState<(() => void) | null>(null);

    // Restore user from localStorage if it exists but currentUser is null
    useEffect(() => {
        if (!currentUser) {
            const savedId = localStorage.getItem('currentUserId');
            const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
            if (savedId && isAuthenticated) {
                const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const foundUser = allUsers.find((u: User) => u.id === savedId);
                if (foundUser) {
                    console.log('✅ Restoring user from localStorage:', foundUser.name);
                    setCurrentUser(foundUser);
                }
            }
        }
    }, [currentUser]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(apiUrl('/departments'));
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data)) {
                    const names = Array.from(new Set(
                        data
                            .map((d: any) => (d.Name || d.name || '').toString().trim())
                            .filter((name: string) => !!name)
                    ));
                    if (names.length) {
                        setAdminDeptOptions(['All', ...names]);
                        if (!adminDept) {
                            setAdminDept('All');
                        }
                    }
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Failed to load departments list', err);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem('risks', JSON.stringify(risks));
    }, [risks]);

    useEffect(() => {
        localStorage.setItem('owners', JSON.stringify(owners));
    }, [owners]);
     
    useEffect(() => {
        localStorage.setItem('users', JSON.stringify(users));
        // If current user is deleted, log them out
        if (currentUser && !users.find(u => u.id === currentUser.id)) {
            setCurrentUser(null);
            localStorage.removeItem('currentUserId');
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
                    // Pass user info to API for server-side filtering
                    const userId = currentUser?.id || '';
                    const userRole = currentUser?.role || '';
                    const queryParams = new URLSearchParams();
                    if (userId) queryParams.set('userId', userId);
                    if (userRole) queryParams.set('role', userRole);
                    const queryString = queryParams.toString();
                    const apiPath = `/risks${queryString ? `?${queryString}` : ''}`;
                    const res = await fetch(apiUrl(apiPath));
                    const data = await res.json();
                    // Debug: log API response for verification
                    // eslint-disable-next-line no-console
                    console.log('Risks API raw response', data);
                    if (Array.isArray(data)) {
                        // Map API to local Risk type if fields align
                            const mapped = data.map((r: any) => ({
                            id: r.RiskId || r.id,
                            riskNo: r.RiskNo || r.riskNo,
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
                            riskIndicator: r.RiskIndicator || r.riskIndicator || undefined,
                        rejectionReason: r.RejectionReason || r.rejectionReason || null,
                            classificationStatus: r.ClassificationStatus || r.classificationStatus || undefined,
                            department: r.Department || r.department || undefined,
                        }));
                        // eslint-disable-next-line no-console
                        console.log('Risks mapped (first 5)', mapped.slice(0,5).map((x:any)=>({riskNo:x.riskNo, identification:x.identification, status:x.status, dept:x.department})));
                        // Role-based scoping for user onboarding view
                        if (currentUser.role === 'user') {
                            const ownRisks = mapped.filter((r: any) => r.createdByUserId === currentUser.id);
                            setRisks(ownRisks);
                        } else if (currentUser.role === 'manager' && currentUser.department) {
                            setRisks(mapped.filter((r: any) => String(r.department || '').toLowerCase() === String(currentUser.department).toLowerCase()));
                        } else if (currentUser.role === 'unit_head') {
                            setRisks(mapped.filter((r: any) => isOperationsDepartment(r.department)));
                        } else if (currentUser.role === 'admin') {
                            const open = (mapped as any[]).filter(r => String(r.status).toLowerCase() !== 'eliminated');
                            const closed = (mapped as any[]).filter(r => String(r.status).toLowerCase() === 'eliminated');
                            setAllRisks(mapped as any);
                            const allDepts = Array.from(new Set((mapped as any[]).map(r => (r.department || '').toString()).filter(Boolean))) as string[];
                            const fallbackOptions = ['All', ...allDepts];
                            if (!adminDeptOptions.length && fallbackOptions.length) {
                                setAdminDeptOptions(fallbackOptions);
                            }
                            const opts = adminDeptOptions.length ? adminDeptOptions : fallbackOptions;
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
                    } else if (currentUser.role === 'unit_head') {
                        params.set('department', DEFAULT_OPERATIONS_LABEL);
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
    }, [currentUser, adminDept, adminStatus, adminDeptOptions]);

    // Recompute admin risk filter when adminDept changes or allRisks update
    useEffect(() => {
        if (currentUser?.role !== 'admin') return;
        const open = allRisks.filter(r => String(r.status).toLowerCase() !== 'eliminated');
        const closed = allRisks.filter(r => String(r.status).toLowerCase() === 'eliminated');
        const allDepts = Array.from(new Set(allRisks.map(r => (r.department || '').toString()).filter(Boolean)));
        const fallbackOptions = ['All', ...allDepts];
        if (!adminDeptOptions.length && fallbackOptions.length) {
            setAdminDeptOptions(fallbackOptions);
        }
        const opts = adminDeptOptions.length ? adminDeptOptions : fallbackOptions;
        const effDept = adminDept && opts.includes(adminDept) ? adminDept : (opts[0] || 'All');
        if (!adminDept && effDept) setAdminDept(effDept);
        const base = adminStatus === 'Open' ? open : (adminStatus === 'Closed' ? closed : [...open, ...closed]);
        const filtered = effDept && effDept !== 'All' ? base.filter(r => String(r.department || '').toLowerCase() === effDept.toLowerCase()) : base;
        setRisks(filtered);
    }, [currentUser, adminDept, adminStatus, allRisks, adminDeptOptions]);

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

    // User switching removed - users can only see their own account

    const handleLoggedIn = (user: User) => {
        // Sync users from localStorage (in case login created a new user)
        const syncedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (Array.isArray(syncedUsers) && syncedUsers.length) {
            setUsers(syncedUsers);
        }
        console.log('✅ User logged in:', user.name, '- Role:', user.role);
        setCurrentUser(user);
    };

    const currentUserId = currentUser?.id;

    const syncUsersFromApi = useCallback(async (focusUserId?: string) => {
        try {
            const res = await fetch(apiUrl('/users'));
            if (!res.ok) {
                const detail = await res.text().catch(() => '');
                // eslint-disable-next-line no-console
                console.error('Failed to load users from API', res.status, detail);
                return false;
            }
            const data = await res.json();
            if (!Array.isArray(data)) return false;
            const normalizeRole = (input: unknown): User['role'] => {
                const value = typeof input === 'string' ? input.toLowerCase() : 'user';
                if (value === 'admin' || value === 'manager' || value === 'unit_head' || value === 'user') {
                    return value as User['role'];
                }
                return 'user';
            };
            const mapped: User[] = data
                .map((apiUser: any) => ({
                    id: apiUser.UserId || apiUser.userId || apiUser.id,
                    name: apiUser.Name || apiUser.name || '',
                    email: apiUser.Email || apiUser.email || undefined,
                    role: normalizeRole(apiUser.Role || apiUser.role),
                    department: apiUser.Department || apiUser.department || undefined,
                    unit: apiUser.Unit || apiUser.unit || undefined,
                    isUnitHead: Boolean(apiUser.IsUnitHead ?? apiUser.isUnitHead),
                    employeeId: apiUser.EmployeeId || apiUser.employeeId || undefined,
                }))
                .filter((u: User) => Boolean(u.id && u.name));
            setUsers(mapped);
            const targetId = focusUserId || currentUserId;
            if (targetId) {
                const updatedCurrent = mapped.find(u => u.id === targetId);
                if (updatedCurrent) {
                    setCurrentUser(updatedCurrent);
                }
            }
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to load users from API', error);
            return false;
        }
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;
        syncUsersFromApi(currentUserId);
    }, [currentUserId, syncUsersFromApi]);

    useEffect(() => {
        if (!pendingLinkAction) return;
        if (!currentUser) return;
        if (linkActionProcessingRef.current) return;

        if (pendingLinkAction.action === 'approve') {
            if (!(currentUser.role === 'manager' || currentUser.role === 'admin')) {
                alert('Only managers or admins can approve risks.');
                setPendingLinkAction(null);
                clearLinkActionFromUrl();
                return;
            }
            linkActionProcessingRef.current = true;
            (async () => {
                try {
                    const res = await fetch(apiUrl(`/risks/${pendingLinkAction.riskId}`), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: 'Open',
                            changedByUserId: currentUser.id,
                        }),
                    });
                    let responseBody: any = null;
                    try {
                        responseBody = await res.json();
                    } catch {
                        responseBody = null;
                    }
                    if (!res.ok) {
                        const message = responseBody?.error || `Failed with status ${res.status}`;
                        throw new Error(message);
                    }
                    const timestamp = new Date().toISOString();
                    setRisks(prev =>
                        prev.map(r =>
                            r.id === pendingLinkAction.riskId
                                ? { ...r, status: 'Open', rejectionReason: null, updatedAt: timestamp }
                                : r
                        )
                    );
                    setAllRisks(prev =>
                        prev.map(r =>
                            r.id === pendingLinkAction.riskId
                                ? { ...r, status: 'Open', rejectionReason: null, updatedAt: timestamp }
                                : r
                        )
                    );
                    alert('Risk approved successfully.');
                } catch (err: any) {
                    alert(`Failed to approve risk automatically: ${err?.message || err}`);
                } finally {
                    linkActionProcessingRef.current = false;
                    setPendingLinkAction(null);
                    clearLinkActionFromUrl();
                }
            })();
        }
    }, [pendingLinkAction, currentUser]);

    // const handleLogout = () => {
    //     // Get currentUserId before clearing
    //     const currentUserIdToRemove = currentUser?.id || localStorage.getItem('currentUserId');
        
    //     // Clear ALL authentication-related localStorage data BEFORE logout
    //     // This prevents auto-login when the page reloads after redirect
    //     localStorage.removeItem('currentUserId');
    //     localStorage.removeItem('azureUser');
        
    //     // Clear users array completely or remove only the current user
    //     if (currentUserIdToRemove) {
    //         const users = JSON.parse(localStorage.getItem('users') || '[]');
    //         const updatedUsers = users.filter((u: User) => u.id !== currentUserIdToRemove);
    //         localStorage.setItem('users', JSON.stringify(updatedUsers));
    //     } else {
    //         // If no currentUserId, clear all users to be safe
    //         localStorage.setItem('users', JSON.stringify([]));
    //     }
        
    //     // Mark that user explicitly logged out - prevents auto-login
    //     // This flag MUST persist until user explicitly clicks sign in
    //     sessionStorage.setItem('userLoggedOut', 'true');
        
    //     // Clear any login in progress flags
    //     sessionStorage.removeItem('azureLoginInProgress');
        
    //     // Clear state immediately
    //     setCurrentUser(null);
    //     setAdminView('risks');
    //     setManagerView('risks');
        
    //     // Always redirect to Azure logout (even if not Azure user, to be safe)
    //     // This ensures Azure session is cleared if it exists
    //     const homePageUrl = window.location.origin;
    //     const timestamp = new Date().getTime();
    //     window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(homePageUrl)}&_=${timestamp}`;
    // };
    const clearBrowserCaches = async () => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.clear();
        } catch (storageErr) {
          console.warn('Unable to clear localStorage during logout', storageErr);
        }
        try {
          sessionStorage.clear();
        } catch (storageErr) {
          console.warn('Unable to clear sessionStorage during logout', storageErr);
        }
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          } catch (cacheErr) {
            console.warn('Unable to clear CacheStorage during logout', cacheErr);
          }
        }
      };

    const handleLogout = async () => {
        if (azureLogoutFn) {
            // Use Azure MSAL logout
            azureLogoutFn();
            setCurrentUser(null);
            localStorage.removeItem('currentUserId');
        } else {
            // Fallback to old method
            await clearBrowserCaches();
            const origin = window.location.origin;
            const aadLogout = `https://login.microsoftonline.com/767a4f7b-5957-4143-8bd4-b152154fe7f6/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(origin)}`;
            window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(aadLogout)}`;
        }
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
                        description: riskData.description,
                        impact: riskData.impact,
                        likelihood: riskData.likelihood,
                        status: riskData.status,
                        category: (riskData as any).category,
                        identification: (riskData as any).identification,
                        existingControlInPlace: (riskData as any).existingControlInPlace,
                        planOfAction: (riskData as any).planOfAction,
                        riskIndicator: (riskData as any).riskIndicator,
                        rejectionReason: (riskData as any).rejectionReason ?? null,
                        changedByUserId: currentUser?.id,
                    })
                });
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to update risk in backend', e);
            }
            const timestamp = new Date().toISOString();
            setRisks(prev => prev.map(r => r.id === riskData.id ? { ...r, ...riskData, updatedAt: timestamp } : r));
            setAllRisks(prev => prev.map(r => r.id === riskData.id ? { ...r, ...riskData, updatedAt: timestamp } : r));
        } else {
            // Add
            // Determine department (prefer risk selection, then user's department)
            const deptFromUser = currentUser?.department?.trim();
            const department =
                (riskData.department && riskData.department.trim()) ||
                (deptFromUser && deptFromUser.trim()) ||
                'General';

            // Compute next risk number for this department (e.g., OP001, CL002)
            const derivePrefix = (name: string | undefined | null): string => {
                if (!name) return 'RS'; // Default prefix with 2 letters
                const normalized = String(name).trim();
                
                // Specific department mappings
                const departmentPrefixMap: Record<string, string> = {
                    'clinical': 'CL',
                    'information security': 'IT',
                    'information technology': 'IT',
                    'informationtechnology': 'IT',
                    'info sec': 'IT',
                    'infosec': 'IT',
                    'it': 'IT',
                    'hr': 'HR',
                    'human resources': 'HR',
                    'humanresource': 'HR',
                    'insurance': 'IN',
                    'operations': 'OP',
                    'operation': 'OP',
                    'facilities': 'FC',
                    'facility': 'FC',
                    'finance': 'F',
                    'finance & accounts': 'F',
                    'finance and accounts': 'F',
                    'financial services': 'F',
                    'accounting': 'AC',
                    'accounts': 'AC',
                    'purchase': 'P',
                    'procurement': 'P',
                    'supply chain': 'SC',
                    'supply-chain': 'SC',
                    'pharmacy': 'PH',
                };
                
                // Normalize input: remove extra spaces and convert to lowercase
                const lowerInput = normalized.toLowerCase().replace(/\s+/g, ' ').trim();
                
                // Check for exact matches (case-insensitive)
                if (departmentPrefixMap[lowerInput]) {
                    return departmentPrefixMap[lowerInput];
                }
                
                // Check for partial matches (e.g., "Clinical Department" contains "clinical")
                // Also check without spaces for variations like "InformationSecurity"
                const inputWithoutSpaces = lowerInput.replace(/\s+/g, '');
                for (const [key, prefix] of Object.entries(departmentPrefixMap)) {
                    const keyWithoutSpaces = key.replace(/\s+/g, '');
                    if (lowerInput.includes(key) || inputWithoutSpaces.includes(keyWithoutSpaces)) {
                        return prefix;
                    }
                }
                
                // Default: use first two alphabetic characters
                const match = normalized.toUpperCase().match(/[A-Z]{2}/);
                if (match) {
                    return match[0];
                }
                
                // Fallback: use first letter + next available letter or 'R'
                const firstLetter = normalized.toUpperCase().match(/[A-Z]/);
                const secondLetter = normalized.slice(1).toUpperCase().match(/[A-Z]/);
                if (firstLetter && secondLetter) {
                    return firstLetter[0] + secondLetter[0];
                }
                if (firstLetter) {
                    return firstLetter[0] + 'R';
                }
                
                return 'RS'; // Final fallback
            };
            const normalizedDept = (department || '').trim().toLowerCase();
            const prefix = derivePrefix(department).toUpperCase();
            const currentMax = risks
                .filter(r => (r.department || '').trim().toLowerCase() === normalizedDept)
                .map(r => {
                    const riskNoValue = (r.riskNo || '').toString().trim().toUpperCase();
                    if (!riskNoValue.startsWith(prefix)) return 0;
                    const remainder = riskNoValue.substring(prefix.length);
                    if (!remainder.length || !/^\d/.test(remainder)) return 0;
                    const numericMatch = remainder.match(/(\d+)/);
                    if (!numericMatch) return 0;
                    const parsed = parseInt(numericMatch[1], 10);
                    return Number.isNaN(parsed) ? 0 : parsed;
                })
                .reduce((a, b) => Math.max(a, b), 0);
            const nextNo = String(currentMax + 1).padStart(3, '0');
            const riskNo = `${prefix}${nextNo}`;

            // Persist to backend so emails and DB stay in sync
            const payload = {
                departmentId: undefined, // resolved server-side by createdByUserId
                riskNo: undefined,       // auto-generated server-side
                departmentName: department,
                description: riskData.description,
                impact: riskData.impact,
                likelihood: riskData.likelihood,
                // user => Raised, manager => as selected (default 'New')
                status: currentUser?.role === 'user' ? 'Raised' : riskData.status,
                ownerId: riskData.ownerId,
                createdByUserId: currentUser?.id,
                category: (riskData as any).category,
                identification: (riskData as any).identification,
                existingControlInPlace: (riskData as any).existingControlInPlace,
                planOfAction: (riskData as any).planOfAction,
                riskIndicator: (riskData as any).riskIndicator,
                rejectionReason: (riskData as any).rejectionReason ?? null,
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
                        description: r.Description,
                        category: undefined,
                        subcategory: undefined,
                        existingControlInPlace: r.ExistingControlInPlace || '',
                        identification: r.Identification || undefined,
                        planOfAction: r.PlanOfAction || '',
                        riskIndicator: r.RiskIndicator || undefined,
                        impact: r.Impact,
                        likelihood: r.Likelihood,
                        status: r.Status,
                        ownerId: r.OwnerId || '',
                        createdByUserId: r.CreatedByUserId,
                        raisedByName: r.CreatedByName || undefined,
                        department: r.Department,
                        createdAt: r.CreatedAtUtc || new Date().toISOString(),
                        updatedAt: r.UpdatedAtUtc || new Date().toISOString(),
                        rejectionReason: r.RejectionReason || null,
                    };
                    setRisks(prev => [mapped, ...prev]);
                    setAllRisks(prev => [mapped, ...prev]);
                } else {
                    // Fallback to local add if server rejects
                    const newRisk: Risk = {
                        ...riskData,
                        id: `r${Date.now()}`,
                        riskNo,
                        department,
                        rejectionReason: (riskData as any).rejectionReason ?? null,
                        createdByUserId: currentUser?.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    if (currentUser?.role === 'user') (newRisk as any).status = 'Raised';
                    setRisks(prev => [newRisk, ...prev]);
                    setAllRisks(prev => [newRisk, ...prev]);
                }
            } catch {
                const newRisk: Risk = {
                    ...riskData,
                    id: `r${Date.now()}`,
                    riskNo,
                    department,
                    rejectionReason: (riskData as any).rejectionReason ?? null,
                    createdByUserId: currentUser?.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                if (currentUser?.role === 'user') (newRisk as any).status = 'Raised';
                setRisks(prev => [newRisk, ...prev]);
                setAllRisks(prev => [newRisk, ...prev]);
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
            const synced = await syncUsersFromApi();
            if (!synced) {
                setUsers((prev) => {
                    const deduped = prev.filter(u => u.id !== newUser.id);
                    return [newUser, ...deduped];
                });
            }
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert(String((e as any)?.message || e));
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (users.length <= 1) {
            alert("Cannot remove the last user.");
            return;
        }
        
        // Prevent deleting the currently logged-in user
        if (currentUser && currentUser.id === userId) {
            alert("Cannot delete the currently logged-in user. Please log in as a different user first.");
            return;
        }

        try {
            const res = await fetch(apiUrl(`/users/${userId}`), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to delete user');
            }

            // Remove from local state
            setUsers(users.filter(u => u.id !== userId));
            
            // Also remove from localStorage users array
            const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const updatedUsers = savedUsers.filter((u: User) => u.id !== userId);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // If deleted user was stored as currentUserId, clear it
            const savedCurrentUserId = localStorage.getItem('currentUserId');
            if (savedCurrentUserId === userId) {
                localStorage.removeItem('currentUserId');
            }
        } catch (e) {
            // eslint-disable-next-line no-alert
            alert(String((e as any)?.message || e));
        }
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
            const synced = await syncUsersFromApi();
            if (!synced) {
                setUsers((prev) => prev.map(u => u.id === id ? updated : u));
            }
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
                <div className="container mx-auto px-1 sm:px-2 lg:px-2">
                    <div className="flex h-16 items-center justify-between">
                         <div className="flex items-center gap-2 -ml-1 sm:-ml-5">
                             <img
                               src="/components/assets/logo.png"
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
                            {currentUser?.role === 'unit_head' && (
                                <div className="hidden sm:flex items-center gap-3 mr-2">
                                    <button
                                        onClick={() => setUnitHeadView('risks')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            unitHeadView === 'risks'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Risks
                                    </button>
                                    <button
                                        onClick={() => setUnitHeadView('reports')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            unitHeadView === 'reports'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Reports
                                    </button>
                                </div>
                            )}
                            {currentUser?.role === 'user' && (
                                <div className="hidden sm:flex items-center gap-3 mr-2">
                                    <button
                                        onClick={() => setUserView('risks')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            userView === 'risks'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Risks
                                    </button>
                                    <button
                                        onClick={() => setUserView('reports')}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                            userView === 'reports'
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content border-base-300 dark:border-dark-300 hover:bg-base-300 dark:hover:bg-dark-200'
                                        }`}
                                    >
                                        Reports
                                    </button>
                                </div>
                            )}
                            <UserSwitcher currentUser={currentUser} />
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
                    <AzureStaticWebAppsLogin 
                        users={users} 
                        onLogin={handleLoggedIn}
                        onLoginReady={(_loginFn, logoutFn) => {
                            setAzureLogoutFn(() => logoutFn);
                        }}
                    />
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
                                description: risk.description,
                                category: risk.category,
                                subcategory: risk.subcategory,
                                impact: risk.impact,
                                likelihood: risk.likelihood,
                                status: 'New',
                                ownerId: risk.ownerId,
                                riskNo: risk.riskNo,
                                department: risk.department,
                                identification: risk.identification,
                                existingControlInPlace: risk.existingControlInPlace,
                                planOfAction: risk.planOfAction,
                                riskIndicator: risk.riskIndicator,
                                rejectionReason: null,
                            })}
                            onRejectRisk={(risk, reason) => handleSaveRisk({
                                id: risk.id,
                                description: risk.description,
                                category: risk.category,
                                subcategory: risk.subcategory,
                                impact: risk.impact,
                                likelihood: risk.likelihood,
                                status: 'Rejected',
                                ownerId: risk.ownerId,
                                riskNo: risk.riskNo,
                                department: risk.department,
                                identification: risk.identification,
                                existingControlInPlace: risk.existingControlInPlace,
                                planOfAction: risk.planOfAction,
                                riskIndicator: risk.riskIndicator,
                                rejectionReason: reason,
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
                                        description: risk.description,
                                        category: risk.category,
                                        subcategory: risk.subcategory,
                                        impact: risk.impact,
                                        likelihood: risk.likelihood,
                                        status: 'New',
                                        ownerId: risk.ownerId,
                                        riskNo: risk.riskNo,
                                        department: risk.department,
                                        identification: risk.identification,
                                        existingControlInPlace: risk.existingControlInPlace,
                                        planOfAction: risk.planOfAction,
                                        riskIndicator: risk.riskIndicator,
                                        rejectionReason: null,
                                    })}
                                    onRejectRisk={(risk, reason) => handleSaveRisk({
                                        id: risk.id,
                                        description: risk.description,
                                        category: risk.category,
                                        subcategory: risk.subcategory,
                                        impact: risk.impact,
                                        likelihood: risk.likelihood,
                                        status: 'Rejected',
                                        ownerId: risk.ownerId,
                                        riskNo: risk.riskNo,
                                        department: risk.department,
                                        identification: risk.identification,
                                        existingControlInPlace: risk.existingControlInPlace,
                                        planOfAction: risk.planOfAction,
                                        riskIndicator: risk.riskIndicator,
                                        rejectionReason: reason,
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
                        if (currentUser.role === 'unit_head') {
                            const opsRisks = risks.filter(r => isOperationsDepartment(r.department));
                            const opsIncidents = incidents.filter(i => opsRisks.some(or => or.id === i.riskId));
                            const deptOptions = ['All', ...Array.from(new Set(opsRisks.map(r => r.department || DEFAULT_OPERATIONS_LABEL))).filter(Boolean)];
                            if (unitHeadView === 'reports') {
                                return (
                                    <ReportsDashboard
                                        risks={opsRisks}
                                        incidents={opsIncidents}
                                        departments={deptOptions.length ? deptOptions : ['All', DEFAULT_OPERATIONS_LABEL]}
                                        currentUser={currentUser}
                                    />
                                );
                            }
                            return (
                                <RiskDashboard
                                    risks={opsRisks}
                                    owners={owners}
                                    users={users}
                                    currentUser={currentUser}
                                    onSaveRisk={handleSaveRisk}
                                    onDeleteRisk={handleDeleteRisk}
                                    incidents={opsIncidents}
                                    incidentHistory={incidentHistory}
                                    onAddIncident={handleAddIncident}
                                    onUpdateIncident={handleUpdateIncident}
                                    aiSummary={aiSummary}
                                    aiLoading={aiLoading}
                                    aiIncidentsSummary={aiIncidentsSummary}
                                    aiIncidentsLoading={aiIncidentsLoading}
                                    onSetSummaryRiskId={setSummaryRiskId}
                                    onRefreshSummary={async () => {
                                        try {
                                            setAiLoading(true);
                                            const selectedRisks = summaryRiskId ? opsRisks.filter(r => r.id === summaryRiskId) : opsRisks;
                                            const selectedRiskIds = new Set(selectedRisks.map(r => r.id));
                                            const selectedIncidents = opsIncidents.filter(i => selectedRiskIds.has(i.riskId));
                                            const res = await fetch(apiUrl('/ai/summary'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: currentUser.name,
                                                    department: DEFAULT_OPERATIONS_LABEL,
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
                                                        currentStatusText: i.currentStatusText,
                                                    })),
                                                }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                console.error('AI summary API error details:', data);
                                                throw new Error(data?.error || 'Failed to generate summary');
                                            }
                                            setAiSummary(String(data.summary || ''));
                                        } catch (e) {
                                            console.error('AI summary refresh failed', e);
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                    onRefreshIncidentsSummary={async () => {
                                        try {
                                            setAiIncidentsLoading(true);
                                            const res = await fetch(apiUrl('/ai/summary'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: currentUser.name,
                                                    department: DEFAULT_OPERATIONS_LABEL,
                                                    risks: opsRisks.map(r => ({
                                                        riskNo: r.riskNo,
                                                        name: r.name,
                                                        description: r.description,
                                                        impact: r.impact,
                                                        likelihood: r.likelihood,
                                                        status: r.status,
                                                        department: r.department,
                                                    })),
                                                    incidents: opsIncidents.map(i => ({
                                                        riskNo: opsRisks.find(r => r.id === i.riskId)?.riskNo,
                                                        summary: i.summary,
                                                        occurredAt: i.occurredAt,
                                                        currentStatusText: i.currentStatusText,
                                                    })),
                                                }),
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
                            const filteredIncidents = incidents.filter(i => filtered.some(fr => fr.id === i.riskId));
                            const deptOptions = ['All', ...Array.from(new Set(filtered.map(r => (r.department || '').toString()).filter(Boolean)))];
                            if (userView === 'reports') {
                                return (
                                    <ReportsDashboard
                                        risks={filtered}
                                        incidents={filteredIncidents}
                                        departments={deptOptions.length ? deptOptions : ['All']}
                                        currentUser={currentUser}
                                    />
                                );
                            }
                            return (
                                <RiskDashboard 
                                    risks={filtered}
                                    owners={owners}
                                    users={users}
                                    currentUser={currentUser}
                                    onSaveRisk={handleSaveRisk}
                                    onDeleteRisk={handleDeleteRisk}
                                    incidents={filteredIncidents}
                                    incidentHistory={incidentHistory}
                                    onAddIncident={handleAddIncident}
                                    onUpdateIncident={handleUpdateIncident}
                                    aiSummary={aiSummary}
                                    aiLoading={aiLoading}
                                    aiIncidentsSummary={aiIncidentsSummary}
                                    aiIncidentsLoading={aiIncidentsLoading}
                                    onSetSummaryRiskId={setSummaryRiskId}
                                    onRefreshSummary={async () => {
                                        try {
                                            const dept = currentUser.department || 'All';
                                            setAiLoading(true);
                                            const selectedRisks = summaryRiskId ? filtered.filter(r => r.id === summaryRiskId) : filtered;
                                            const selectedRiskIds = new Set(selectedRisks.map(r => r.id));
                                            const selectedIncidents = filteredIncidents.filter(i => selectedRiskIds.has(i.riskId));
                                            const res = await fetch(apiUrl('/ai/summary'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: currentUser.name,
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
                                                        currentStatusText: i.currentStatusText,
                                                    })),
                                                })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                                console.error('AI summary API error details:', data);
                                                throw new Error(data?.error || 'Failed to generate summary');
                                            }
                                            setAiSummary(String(data.summary || ''));
                                        } catch (e) {
                                            console.error('AI summary refresh failed', e);
                                        } finally {
                                            setAiLoading(false);
                                        }
                                    }}
                                    onRefreshIncidentsSummary={async () => {
                                        try {
                                            const dept = currentUser.department || 'All';
                                            setAiIncidentsLoading(true);
                                            const res = await fetch(apiUrl('/ai/summary'), {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    role: currentUser.role,
                                                    userName: currentUser.name,
                                                    department: dept,
                                                    risks: filtered.map(r => ({
                                                        riskNo: r.riskNo,
                                                        name: r.name,
                                                        description: r.description,
                                                        impact: r.impact,
                                                        likelihood: r.likelihood,
                                                        status: r.status,
                                                        department: r.department,
                                                    })),
                                                    incidents: filteredIncidents.map(i => ({
                                                        riskNo: filtered.find(r => r.id === i.riskId)?.riskNo,
                                                        summary: i.summary,
                                                        occurredAt: i.occurredAt,
                                                        currentStatusText: i.currentStatusText,
                                                    })),
                                                }),
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
                                    description: risk.description,
                                    category: risk.category,
                                    subcategory: risk.subcategory,
                                    impact: risk.impact,
                                    likelihood: risk.likelihood,
                                    status: 'New',
                                    ownerId: risk.ownerId,
                                    riskNo: risk.riskNo,
                                    department: risk.department,
                                    identification: risk.identification,
                                    existingControlInPlace: risk.existingControlInPlace,
                                    planOfAction: risk.planOfAction,
                                    riskIndicator: risk.riskIndicator,
                                    rejectionReason: null,
                                })}
                                onRejectRisk={(risk, reason) => handleSaveRisk({
                                    id: risk.id,
                                    description: risk.description,
                                    category: risk.category,
                                    subcategory: risk.subcategory,
                                    impact: risk.impact,
                                    likelihood: risk.likelihood,
                                    status: 'Rejected',
                                    ownerId: risk.ownerId,
                                    riskNo: risk.riskNo,
                                    department: risk.department,
                                    identification: risk.identification,
                                    existingControlInPlace: risk.existingControlInPlace,
                                    planOfAction: risk.planOfAction,
                                    riskIndicator: risk.riskIndicator,
                                    rejectionReason: reason,
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