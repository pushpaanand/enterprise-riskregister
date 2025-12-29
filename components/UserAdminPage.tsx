import React, { useState, useEffect, FormEvent } from 'react';
import { User } from '../types';
import { PlusIcon, TrashIcon } from '../constants';
import { apiUrl } from '../api';


const unitOptions = [
  { code: 'KCH', name: 'Kauvery Hospital, Chennai (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KVP', name: 'Kauvery Hospital, Vadapalani (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KRR', name: 'Kauvery Hospital, Kovilambakkam (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KHC', name: 'Kauvery Hospital, Heartcity, Trichy (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KTN', name: 'Kauvery Hospital, Tennur, Trichy (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KSM', name: 'Kauvery Hospital, Salem (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KTV', name: 'Kauvery Hospital, Tirunelveli (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KHO', name: 'Kauvery Hospital, Hosur (A Unit Of Sri Kauvery Medical Care India Limited)' },
  { code: 'KEC', name: 'Sri Kauvery Medical Care India Limited (Electronic City)' },
  { code: 'KMH', name: 'Sri Kauvery Medical Care India Limited (Marathahalli)' },
  { code: 'KCN', name: 'KMC Specialty Hospitals India Limited - Cantonment, Trichy' },
  { code: 'KMC', name: 'MAA Kauvery (A Unit of KMC Specialty Hospitals India Limited - Trichy)' },
];

interface UserAdminPageProps {
  users: User[];
  onAddUser: (name: string, role: 'user' | 'manager' | 'admin' | 'unit_head', departments?: string[], email?: string, unit?: string, isUnitHead?: boolean, employeeId?: string) => void;
  onRemoveUser: (id: string) => void;
  onUpdateUser?: (id: string, name: string, role: 'user' | 'manager' | 'admin' | 'unit_head', departments?: string[], email?: string, unit?: string, isUnitHead?: boolean, employeeId?: string) => void;
}

const UserAdminPage: React.FC<UserAdminPageProps> = ({ users, onAddUser, onRemoveUser, onUpdateUser }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'manager' | 'admin' | 'unit_head'>('user');
  const [editDepts, setEditDepts] = useState<string[]>([]);
  const [editEmail, setEditEmail] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editIsUnitHead, setEditIsUnitHead] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState('');

  const startEdit = async (u: User) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditEmail(u.email || '');
    setEditUnit(u.unit || '');
    setEditIsUnitHead(Boolean(u.isUnitHead));
    setEditEmployeeId(u.employeeId || '');
    
    // Load assigned departments for this user
    try {
      const res = await fetch(apiUrl(`/users/${u.id}/departments`));
      const data = await res.json();
      if (Array.isArray(data)) {
        setEditDepts(data.map((d: any) => d.Department).filter(Boolean));
      } else {
        // Fallback to single department if API fails
        setEditDepts(u.department ? [u.department] : []);
      }
    } catch (e) {
      // Fallback to single department if API fails
      setEditDepts(u.department ? [u.department] : []);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditRole('user');
    setEditDepts([]);
  };

  const normalizeEmployeeId = (val: string): string | null => {
    const raw = (val || '').trim();
    const six = /^[0-9]{6}$/;
    const full = /^[0-9]{6}@kauveryhospital\.com$/i;
    if (six.test(raw)) return `${raw}@kauveryhospital.com`;
    if (full.test(raw)) return `${raw.substring(0,6)}@kauveryhospital.com`;
    return null;
  };

  const [editEmpError, setEditEmpError] = useState<string>('');

  const saveEdit = async () => {
    if (!editingId) return;
    const normEmp = normalizeEmployeeId(editEmployeeId);
    if (!normEmp) {
      setEditEmpError("Enter 6 digits (will be saved as 123456@kauveryhospital.com)");
      return;
    }
    if (onUpdateUser) {
      await onUpdateUser(
        editingId,
        editName.trim(),
        editRole,
        (editRole === 'admin' || editRole === 'unit_head') ? undefined : editDepts,
        editEmail.trim() || undefined,
        editUnit.trim() || undefined,
        editIsUnitHead,
        normEmp
      );
    }
    cancelEdit();
  };
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'manager' | 'admin' | 'unit_head'>('user');
  const [newUserDepts, setNewUserDepts] = useState<string[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUnit, setNewUserUnit] = useState('');
  const [newUserIsUnitHead, setNewUserIsUnitHead] = useState(false);
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newEmpError, setNewEmpError] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/departments'));
        const data = await res.json();
        if (Array.isArray(data)) {
          setDepartments(data.map((d: any) => d.Name).filter(Boolean));
        }
      } catch (_e) {
        // ignore
      }
    })();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normEmp = normalizeEmployeeId(newUserEmpId);
    if (!newUserName.trim()) return;
    if (!normEmp) {
      setNewEmpError("Enter 6 digits (will be saved as 123456@kauveryhospital.com)");
      return;
    }
    onAddUser(
      newUserName.trim(),
      newUserRole,
      (newUserRole === 'admin' || newUserRole === 'unit_head') ? undefined : newUserDepts,
      newUserEmail.trim() || undefined,
      newUserUnit.trim() || undefined,
      newUserIsUnitHead,
      normEmp
    );
      setNewUserName('');
      setNewUserRole('user');
      setNewUserDepts([]);
      setNewUserEmail('');
      setNewUserUnit('');
      setNewUserIsUnitHead(false);
      setNewUserEmpId('');
      setNewEmpError('');
    
  };

  const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";
  const selectStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 pl-3 pr-10 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";


  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-base-content dark:text-dark-content sm:truncate sm:text-3xl sm:tracking-tight">
          Manage Users
        </h2>
        <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">
          Add or remove users. Users with the 'admin' role can access this admin panel.
        </p>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-grow min-w-[200px]">
             <label htmlFor="new-user-name" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">User Name</label>
            <input
              type="text"
              id="new-user-name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter new user name..."
              className={inputStyles + ' mt-1'}
            />
          </div>
          <div className="flex-grow min-w-[220px]">
            <label htmlFor="new-user-email" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Email</label>
            <input
              type="email"
              id="new-user-email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="name@company.com"
              className={inputStyles + ' mt-1'}
            />
          </div>
          <div className="flex-grow min-w-[160px]">
            <label htmlFor="new-user-empid" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Employee ID</label>
            <input
              type="text"
              id="new-user-empid"
              value={newUserEmpId}
              onChange={(e) => { setNewUserEmpId(e.target.value); setNewEmpError(''); }}
              placeholder="123456"
              className={inputStyles + ' mt-1'}
            />
            {newEmpError && <div className="text-xs text-red-600 mt-1">{newEmpError}</div>}
            <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">Will be saved as 123456@kauveryhospital.com</div>
          </div>
          <div className="flex-grow min-w-[150px]">
            <label htmlFor="new-user-role" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Role</label>
            <select
                id="new-user-role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'user' | 'manager' | 'admin' | 'unit_head')}
                className={selectStyles + ' mt-1'}
            >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="unit_head">Unit Head</option>
            </select>
          </div>
          {(newUserRole !== 'admin' && newUserRole !== 'unit_head') && (
            <div className="flex-grow min-w-[250px]">
              <label htmlFor="new-user-depts" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">
                Departments {newUserDepts.length > 0 && <span className="text-xs text-base-content-muted dark:text-dark-content-muted">({newUserDepts.length} selected)</span>}
              </label>
              <select
                id="new-user-depts"
                multiple
                size={4}
                value={newUserDepts}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setNewUserDepts(selected);
                }}
                className={selectStyles + ' mt-1'}
              >
                {departments.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">
                Hold Ctrl/Cmd to select multiple departments
              </div>
            </div>
          )}
          <div className="flex-grow min-w-[240px]">
            <label htmlFor="new-user-unit" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Unit</label>
            <select
              id="new-user-unit"
              value={newUserUnit}
              onChange={(e) => setNewUserUnit(e.target.value)}
              className={selectStyles + ' mt-1'}
            >
              <option value="">Select Unit</option>
              {unitOptions.map((unit) => (
                <option key={unit.code} value={unit.code} title={unit.name}>
                  {unit.code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-[140px]">
            <input id="new-user-isunithead" type="checkbox" className="accent-brand-primary" checked={newUserIsUnitHead} onChange={(e) => setNewUserIsUnitHead(e.target.checked)} />
            <label htmlFor="new-user-isunithead" className="text-sm text-base-content dark:text-dark-content">Is Unit Head</label>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-x-2 rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-colors disabled:opacity-50"
            disabled={!newUserName.trim() || ((newUserRole !== 'admin' && newUserRole !== 'unit_head') && newUserDepts.length === 0)}
          >
            <PlusIcon />
            Add User
          </button>
        </form>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow">
        <ul className="divide-y divide-base-300 dark:divide-dark-300">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between p-4">
              {editingId === user.id ? (
                <div className="w-full flex flex-wrap items-end gap-3">
                  <div className="min-w-[180px] flex-1">
                    <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">Name</label>
                    <input className={inputStyles + ' mt-1'} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">Email</label>
                    <input className={inputStyles + ' mt-1'} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="name@company.com" />
                  </div>
                  <div className="min-w-[140px]">
                    <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">Role</label>
                    <select className={selectStyles + ' mt-1'} value={editRole} onChange={(e) => setEditRole(e.target.value as 'user' | 'manager' | 'admin' | 'unit_head')}>
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="unit_head">Unit Head</option>
                    </select>
                  </div>
                  <div className="min-w-[160px]">
                    <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">Employee ID</label>
                    <input className={inputStyles + ' mt-1'} value={editEmployeeId} onChange={(e) => { setEditEmployeeId(e.target.value); setEditEmpError(''); }} placeholder="123456" />
                    {editEmpError && <div className="text-xs text-red-600 mt-1">{editEmpError}</div>}
                    <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">Format: 6 digits → saved as 123456@kauveryhospital.com</div>
                  </div>
                  {(editRole !== 'admin' && editRole !== 'unit_head') && (
                    <div className="min-w-[250px]">
                      <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">
                        Departments {editDepts.length > 0 && <span className="text-xs text-base-content-muted dark:text-dark-content-muted">({editDepts.length} selected)</span>}
                      </label>
                      <select 
                        multiple
                        size={4}
                        className={selectStyles + ' mt-1'} 
                        value={editDepts} 
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setEditDepts(selected);
                        }}
                      >
                        {departments.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <div className="text-xs text-base-content-muted dark:text-dark-content-muted mt-1">
                        Hold Ctrl/Cmd to select multiple departments
                      </div>
                    </div>
                  )}
                  <div className="min-w-[240px]">
                    <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">Unit</label>
                    <select className={selectStyles + ' mt-1'} value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                      <option value="">Select Unit</option>
                      {unitOptions.map((unit) => (
                        <option key={unit.code} value={unit.code} title={unit.name}>
                          {unit.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="edit-isunithead" type="checkbox" className="accent-brand-primary" checked={editIsUnitHead} onChange={(e) => setEditIsUnitHead(e.target.checked)} />
                    <label htmlFor="edit-isunithead" className="text-xs text-base-content dark:text-dark-content">Is Unit Head</label>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={saveEdit} disabled={!editName.trim() || ((editRole !== 'admin' && editRole !== 'unit_head') && editDepts.length === 0)} className="px-3 py-1.5 text-sm rounded-md border bg-green-600 text-white hover:bg-green-500 transition-colors">Save</button>
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-sm rounded-md border bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content hover:bg-base-300 dark:hover:bg-dark-200 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-base-content dark:text-dark-content">{user.name}</span>
                    {user.email && <span className="block text-xs text-base-content-muted dark:text-dark-content-muted">{user.email}</span>}
                    {user.employeeId && <span className="block text-xs text-base-content-muted dark:text-dark-content-muted">Emp ID: {user.employeeId}</span>}
                    <span className="block text-xs uppercase font-semibold text-base-content-muted dark:text-dark-content-muted">
                      {user.role}
                      {(user as any).assignedDepartments 
                        ? ` • ${(user as any).assignedDepartments}` 
                        : user.department 
                        ? ` • ${user.department}` 
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(user)} className="text-brand-primary hover:opacity-80 transition-colors" aria-label={`Edit ${user.name}`}>Edit</button>
                    <button
                      onClick={() => onRemoveUser(user.id)}
                      className="text-red-500/70 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${user.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
           {users.length === 0 && (
            <li className="p-4 text-center text-sm text-base-content-muted dark:text-dark-content-muted">
              No users found.
            </li>
           )}
        </ul>
      </div>
    </div>
  );
};

export default UserAdminPage;