import React from 'react';
import { User } from '../types';

interface UserSwitcherProps {
  currentUser: User | null;
}

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
    </svg>
);

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser }) => {
    if (!currentUser) return null;

    // Format role for display (capitalize first letter)
    const formatRole = (role: string): string => {
        if (!role) return '';
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    return (
        <div className="flex items-center gap-2 rounded-md bg-base-300/50 dark:bg-dark-300 px-3 py-2 text-sm font-medium text-base-content dark:text-dark-content">
            <UserIcon />
            <div className="flex flex-col">
                <span className="leading-tight">{currentUser.name}</span>
                {/* <span className="text-xs text-base-content-muted dark:text-dark-content-muted leading-tight">
                    {formatRole(currentUser.role)}
                </span> */}
            </div>
        </div>
    );
};

export default UserSwitcher;