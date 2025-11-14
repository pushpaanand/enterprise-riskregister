import React, { useState } from 'react';
import { User } from '../types';
import UserAdminPage from './UserAdminPage';
import DepartmentAdminPage from './DepartmentAdminPage';
import UnitHeadMailer from './UnitHeadMailer';

interface AdminDashboardProps {
    users: User[];
    onAddUser: (name: string, role: 'user' | 'manager' | 'admin' | 'unit_head', department?: string, email?: string, unit?: string, isUnitHead?: boolean, employeeId?: string) => void;
    onRemoveUser: (id: string) => void;
    onUpdateUser?: (id: string, name: string, role: 'user' | 'manager' | 'admin' | 'unit_head', department?: string, email?: string, unit?: string, isUnitHead?: boolean, employeeId?: string) => void;
}

type AdminTab = 'users' | 'departments' | 'email';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="border-b border-base-300 dark:border-dark-300 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`${
                            activeTab === 'users'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-base-content-muted dark:text-dark-content-muted hover:border-gray-300 dark:hover:border-gray-700 hover:text-base-content dark:hover:text-dark-content'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
                    >
                        Manage Users
                    </button>
                    <button
                        onClick={() => setActiveTab('departments')}
                        className={`${
                            activeTab === 'departments'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-base-content-muted dark:text-dark-content-muted hover:border-gray-300 dark:hover:border-gray-700 hover:text-base-content dark:hover:text-dark-content'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
                    >
                        Manage Departments
                    </button>
                <button
                        onClick={() => setActiveTab('email')}
                        className={`${
                            activeTab === 'email'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-base-content-muted dark:text-dark-content-muted hover:border-gray-300 dark:hover:border-gray-700 hover:text-base-content dark:hover:text-dark-content'
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
                    >
                        Email Unit Heads
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'users' && (
                     <UserAdminPage
                        users={props.users}
                        onAddUser={props.onAddUser}
                        onRemoveUser={props.onRemoveUser}
                        onUpdateUser={props.onUpdateUser}
                    />
                )}
                {activeTab === 'departments' && (
                    <DepartmentAdminPage />
                )}
                {activeTab === 'email' && (
                    <UnitHeadMailer />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;