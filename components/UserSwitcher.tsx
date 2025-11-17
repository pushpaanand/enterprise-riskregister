import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface UserSwitcherProps {
  users: User[];
  currentUser: User | null;
  onUserChange: (userId: string) => void;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
    </svg>
);

const UserSwitcher: React.FC<UserSwitcherProps> = ({ users, currentUser, onUserChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowAll(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(prev => !prev);
                    if (isOpen) setShowAll(false);
                }}
                className="flex items-center gap-2 rounded-md bg-base-300/50 dark:bg-dark-300 px-3 py-2 text-sm font-medium text-base-content dark:text-dark-content hover:bg-base-300 dark:hover:bg-dark-200 transition-colors"
                aria-label={`Current user: ${currentUser.name}`}
            >
                <UserIcon />
                <span>{currentUser.name} ({currentUser.role})</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-md bg-base-200 dark:bg-dark-200 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="px-4 py-2 text-xs text-base-content-muted dark:text-dark-content-muted flex items-center justify-between">
                            <span>Switch User</span>
                            {users.length > 3 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAll(prev => !prev)}
                                    className="text-brand-primary hover:underline text-[11px]"
                                >
                                    {showAll ? 'View less' : `View all (${users.length})`}
                                </button>
                            )}
                        </div>
                        {(showAll ? users : users.slice(0, 3)).map(user => (
                            <button
                                key={user.id}
                                onClick={() => {
                                    onUserChange(user.id);
                                    setIsOpen(false);
                                    setShowAll(false);
                                }}
                                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${
                                    currentUser.id === user.id
                                        ? 'bg-brand-primary/20 text-brand-primary'
                                        : 'text-base-content dark:text-dark-content'
                                } hover:bg-base-300 dark:hover:bg-dark-300`}
                                role="menuitem"
                            >
                                <span className="flex-1">{user.name} ({user.role})</span>
                            </button>
                        ))}
                        {!showAll && users.length > 3 && (
                            <div className="px-4 py-2 text-xs text-base-content-muted dark:text-dark-content-muted">
                                {users.length - 3} more user{users.length - 3 === 1 ? '' : 's'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSwitcher;