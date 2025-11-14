import React, { Fragment } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const XMarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);


const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="relative z-30" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          {/* Modal Panel */}
          <div className="relative transform overflow-hidden rounded-lg bg-base-200 dark:bg-dark-200 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold leading-6 text-base-content dark:text-dark-content" id="modal-title">{title}</h3>
                    <button onClick={onClose} className="text-base-content-muted dark:text-dark-content-muted hover:text-base-content dark:hover:text-dark-content">
                        <span className="sr-only">Close</span>
                        <XMarkIcon/>
                    </button>
                </div>
                <div className="mt-5">
                    {children}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;