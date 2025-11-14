import React, { useState, FormEvent } from 'react';
import { Owner } from '../types';
import { PlusIcon, TrashIcon } from '../constants';

interface OwnerAdminPageProps {
  owners: Owner[];
  onAddOwner: (name: string, department: string) => void;
  onRemoveOwner: (id: string) => void;
}

const OwnerAdminPage: React.FC<OwnerAdminPageProps> = ({ owners, onAddOwner, onRemoveOwner }) => {
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerDepartment, setNewOwnerDepartment] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newOwnerName.trim() && newOwnerDepartment.trim()) {
      onAddOwner(newOwnerName.trim(), newOwnerDepartment.trim());
      setNewOwnerName('');
      setNewOwnerDepartment('');
    }
  };

  const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6"

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-base-content dark:text-dark-content sm:truncate sm:text-3xl sm:tracking-tight">
          Manage Owners
        </h2>
        <p className="mt-1 text-sm text-base-content-muted dark:text-dark-content-muted">
          Add or remove owners from the master list. This list populates the 'Owner' dropdown when creating a new risk.
        </p>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
          <div className="flex-grow min-w-[200px]">
            <label htmlFor="new-owner-name" className="sr-only">New owner name</label>
            <input
              type="text"
              id="new-owner-name"
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              placeholder="Enter new owner name..."
              className={inputStyles}
            />
          </div>
          <div className="flex-grow min-w-[200px]">
            <label htmlFor="new-owner-department" className="sr-only">New owner department</label>
            <input
              type="text"
              id="new-owner-department"
              value={newOwnerDepartment}
              onChange={(e) => setNewOwnerDepartment(e.target.value)}
              placeholder="Enter department..."
              className={inputStyles}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-x-2 rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-colors disabled:opacity-50"
            disabled={!newOwnerName.trim() || !newOwnerDepartment.trim()}
          >
            <PlusIcon />
            Add Owner
          </button>
        </form>
      </div>

      <div className="bg-base-200 dark:bg-dark-200 rounded-lg shadow">
        <ul className="divide-y divide-base-300 dark:divide-dark-300">
          {owners.map((owner) => (
            <li key={owner.id} className="flex items-center justify-between p-4">
              <div>
                <span className="text-sm font-medium text-base-content dark:text-dark-content">{owner.name}</span>
                <span className="block text-xs text-base-content-muted dark:text-dark-content-muted">{owner.department}</span>
              </div>
              <button
                onClick={() => onRemoveOwner(owner.id)}
                className="text-red-500/70 hover:text-red-500 transition-colors"
                aria-label={`Remove ${owner.name}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
           {owners.length === 0 && (
            <li className="p-4 text-center text-sm text-base-content-muted dark:text-dark-content-muted">
              No owners found. Add one using the form above.
            </li>
           )}
        </ul>
      </div>
       <p className="text-xs text-center text-base-content-muted dark:text-dark-content-muted pt-4">
        Note: This admin page is for demonstration purposes. In a production environment, it should be protected by authentication.
      </p>
    </div>
  );
};

export default OwnerAdminPage;