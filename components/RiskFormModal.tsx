import React, { useState, useEffect, FormEvent } from 'react';
import { Risk, Owner, RiskImpact, RiskLikelihood, RiskStatus } from '../types';
import Modal from './ui/Modal';

interface RiskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  riskToEdit?: Risk | null;
  owners: Owner[];
}

// Removed AI generation

const RiskFormModal: React.FC<RiskFormModalProps> = ({ isOpen, onClose, onSave, riskToEdit, owners }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<RiskImpact>('Moderate');
  const [likelihood, setLikelihood] = useState<RiskLikelihood>('Possible');
  const [status, setStatus] = useState<RiskStatus>('New');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [existingControl, setExistingControl] = useState<string>('');
  const [identification, setIdentification] = useState<'Inherent risk' | 'Residual risk'>('Inherent risk');
  const [planOfAction, setPlanOfAction] = useState<string>('');
  // classification status removed per request; keep lifecycle status only

  useEffect(() => {
    if (riskToEdit) {
      setName(riskToEdit.name);
      setDescription(riskToEdit.description);
      setImpact(riskToEdit.impact);
      setLikelihood(riskToEdit.likelihood);
      setStatus(riskToEdit.status);
      setExistingControl(riskToEdit.existingControlInPlace || '');
      setIdentification((riskToEdit.identification as any) || 'Inherent risk');
      setOwnerId(riskToEdit.ownerId);
      setCategory(riskToEdit.category || '');
      setSubcategory(riskToEdit.subcategory || '');
      setPlanOfAction(riskToEdit.planOfAction || '');
    } else {
      // Reset form when opening for a new risk
      setName('');
      setDescription('');
      setImpact('Moderate');
      setLikelihood('Possible');
      setStatus('New');
      setCategory('');
      setSubcategory('');
      setExistingControl('');
      setIdentification('Inherent risk');
      setOwnerId(owners[0]?.id || '');
      setPlanOfAction('');
    }
  }, [riskToEdit, isOpen, owners]);
  
  // Owner selection is hidden; keep internal state but not required

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      id: riskToEdit?.id,
      name: name || (description.trim().split('\n')[0].slice(0, 80) || 'Risk'),
      description,
      category,
      // subcategory removed from form
      existingControlInPlace: existingControl,
      identification,
      planOfAction,
      impact,
      likelihood,
      status,
      ownerId,
    });
    onClose();
  };


  const inputStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 px-3 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 placeholder:text-base-content-muted dark:placeholder:dark-content-muted focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";
  const selectStyles = "block w-full rounded-md border-0 bg-base-100 dark:bg-dark-100 py-2.5 pl-3 pr-10 text-base-content dark:text-dark-content ring-1 ring-inset ring-base-300 dark:ring-dark-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={riskToEdit ? 'Edit Risk' : 'Add New Risk'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="risk-no" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">
            Risk ID
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="risk-no"
              value={riskToEdit?.riskNo || 'Will be assigned on save'}
              readOnly
              className={inputStyles}
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Category</label>
          <div className="mt-2">
            <input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Security" className={inputStyles} />
          </div>
        </div>

        <div>
           <label htmlFor="description" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">
            Description
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className={inputStyles}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="impact" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Impact</label>
            <div className="mt-2">
              <select id="impact" value={impact} onChange={(e) => setImpact(e.target.value as RiskImpact)} className={selectStyles}>
                <option>Severe</option>
                <option>Significant</option>
                <option>Moderate</option>
                <option>Minor</option>
                <option>Negligible</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="likelihood" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Likelihood</label>
            <div className="mt-2">
              <select id="likelihood" value={likelihood} onChange={(e) => setLikelihood(e.target.value as RiskLikelihood)} className={selectStyles}>
                <option>Very likely</option>
                <option>Likely</option>
                <option>Possible</option>
                <option>Unlikely</option>
                <option>Very Unlikely</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="identification" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Identification</label>
            <div className="mt-2">
              <select id="identification" value={identification} onChange={(e) => setIdentification(e.target.value as any)} className={selectStyles}>
                <option>Inherent risk</option>
                <option>Residual risk</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="status" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Status</label>
            <div className="mt-2">
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectStyles}>
                <option>New</option>
                <option>Existing</option>
                <option>Downgraded</option>
                <option>Upgraded</option>
                <option>Eliminated</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="existing-control" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Existing Control in Place</label>
            <div className="mt-2">
              <textarea id="existing-control" rows={3} value={existingControl} onChange={(e) => setExistingControl(e.target.value)} className={inputStyles} placeholder="Describe current controls in place" />
            </div>
          </div>
        </div>

        {/* Subcategory removed; owner field not shown */}

        <div>
          <label htmlFor="plan-of-action" className="block text-sm font-medium leading-6 text-base-content dark:text-dark-content">Plan of Action</label>
          <div className="mt-2">
            <textarea id="plan-of-action" rows={3} value={planOfAction} onChange={(e) => setPlanOfAction(e.target.value)} className={inputStyles} placeholder="Outline the remediation plan" />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="rounded-md bg-base-300 dark:bg-dark-300 px-3 py-2 text-sm font-semibold text-base-content dark:text-dark-content shadow-sm hover:bg-base-200 dark:hover:bg-dark-200">
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            Save Risk
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RiskFormModal;