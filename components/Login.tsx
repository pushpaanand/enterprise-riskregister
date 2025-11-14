import React, { useState } from 'react';
import { User } from '../types';
import { apiUrl } from '../api';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'manager' | 'admin'>('user');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = { name: name.trim(), role };
      if (role !== 'admin' && department.trim()) {
        payload.department = department.trim();
      }
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      const apiUser = data.user as any;
      const selectedUser: User = {
        id: apiUser.UserId,
        name: apiUser.Name,
        role: apiUser.Role as 'user' | 'manager' | 'admin',
        department: apiUser.Department || department || undefined,
      };
      localStorage.setItem('currentUserId', selectedUser.id);
      const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const updated = [selectedUser, ...existingUsers.filter(u => u.id !== selectedUser.id)];
      localStorage.setItem('users', JSON.stringify(updated));
      onLogin(selectedUser);
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(true);
      setLoading(false);
    }
  };

  const quickLogin = async (target: 'admin' | 'user' | 'manager') => {
    setRole(target);
    setName(target === 'admin' ? 'Alex' : target === 'manager' ? 'Maya' : 'Sam');
    if (target !== 'admin' && !department) setDepartment('Engineering');
  };

  const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 px-3 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";
  const selectStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 pl-3 pr-10 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-md shadow p-6">
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-content mb-6">Sign in to RiskRay</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className={inputStyles + ' mt-2'} required />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as 'user' | 'manager' | 'admin')} className={selectStyles + ' mt-2'}>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {role !== 'admin' && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Department</label>
              <input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Marketing" className={inputStyles + ' mt-2'} />
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 disabled:opacity-50" onClick={handleSubmit as any}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <button onClick={() => quickLogin('user')} className="rounded-md bg-base-300 dark:bg-dark-300 px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content hover:bg-base-300/70">Demo User</button>
          <button onClick={() => quickLogin('manager')} className="rounded-md bg-base-300 dark:bg-dark-300 px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content hover:bg-base-300/70">Demo Manager</button>
          <button onClick={() => quickLogin('admin')} className="rounded-md bg-base-300 dark:bg-dark-300 px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content hover:bg-base-300/70">Demo Admin</button>
        </div>
      </div>
    </div>
  );
};

export default Login;

