import React, { useEffect, useState, FormEvent } from 'react';
import { apiUrl } from '../api';

interface Department {
  DepartmentId: string;
  Name: string;
}

const DepartmentAdminPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const loadDepartments = async () => {
    try {
      const res = await fetch(apiUrl('/departments'));
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data);
    } catch (_e) {
      // noop
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/departments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDept.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add department');
      setNewDept('');
      await loadDepartments();
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(String((e as any)?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-base-content dark:text-dark-content sm:truncate sm:text-3xl sm:tracking-tight">
          Manage Departments
        </h2>
        <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">
          Add departments to be used by users and managers.
        </p>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-grow min-w-[200px]">
             <label htmlFor="new-dept-name" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Department Name</label>
            <input
              type="text"
              id="new-dept-name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g., Marketing"
              className={inputStyles + ' mt-1'}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-x-2 rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-colors disabled:opacity-50"
            disabled={!newDept.trim() || loading}
          >
            Add Department
          </button>
        </form>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow">
        <ul className="divide-y divide-base-300 dark:divide-dark-300">
          {departments.map((d) => (
            <li key={d.DepartmentId} className="flex items-center justify-between p-4">
              {editingId === d.DepartmentId ? (
                <div className="w-full flex items-end gap-3">
                  <div className="min-w-[200px] flex-1">
                    <label className="block text-xs font-medium leading-6 text-base-content dark:text-dark-content">Department Name</label>
                    <input className={inputStyles + ' mt-1'} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={async () => {
                        if (!editingId) return;
                        if (!editName.trim()) return;
                        try {
                          const res = await fetch(apiUrl(`/departments/${editingId}`), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: editName.trim() })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || 'Failed to update department');
                          setEditingId(null);
                          setEditName('');
                          await loadDepartments();
                        } catch (e) {
                          // eslint-disable-next-line no-alert
                          alert(String((e as any)?.message || e));
                        }
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border bg-green-600 text-white hover:bg-green-500 transition-colors"
                    >
                      Save
                    </button>
                    <button onClick={() => { setEditingId(null); setEditName(''); }} className="px-3 py-1.5 text-sm rounded-md border bg-base-300/50 dark:bg-dark-300 text-base-content dark:text-dark-content hover:bg-base-300 dark:hover:bg-dark-200 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-base-content dark:text-dark-content">{d.Name}</span>
                  </div>
                  <button onClick={() => { setEditingId(d.DepartmentId); setEditName(d.Name); }} className="text-brand-primary hover:opacity-80 transition-colors">Edit</button>
                </>
              )}
            </li>
          ))}
          {departments.length === 0 && (
            <li className="p-4 text-center text-sm text-base-content-muted dark:text-dark-content-muted">
              No departments found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DepartmentAdminPage;

