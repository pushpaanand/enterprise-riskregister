import React, { useState, useEffect, useRef } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { User } from '../types';
import { apiUrl } from '../api';
import { msalConfig, loginRequest } from '../msalConfig';

interface AzureStaticWebAppsLoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const AzureStaticWebAppsLogin: React.FC<AzureStaticWebAppsLoginProps> = ({ users: _users, onLogin }) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const msalInstanceRef = useRef<PublicClientApplication | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Check if user is already logged in (from previous session)
        const existingUserId = localStorage.getItem('currentUserId');
        if (existingUserId) {
          // User might already be logged in, check if we have an MSAL account
          const instance = new PublicClientApplication(msalConfig);
          msalInstanceRef.current = instance;
          if ((instance as any).initialize) {
            await (instance as any).initialize();
          }
          
          const activeAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];
          if (activeAccount) {
            instance.setActiveAccount(activeAccount);
            // Don't call finalizeLogin again if already logged in, just set loading to false
            // The parent App.tsx should handle showing the dashboard
            setAccount(activeAccount);
            setIsLoggedIn(true);
            setLoading(false);
            return;
          }
        }

        const instance = new PublicClientApplication(msalConfig);
        msalInstanceRef.current = instance;
        if ((instance as any).initialize) {
          await (instance as any).initialize();
        }

        const redirectResponse = await instance.handleRedirectPromise();
        const activeAccount =
          redirectResponse?.account ||
          instance.getActiveAccount() ||
          instance.getAllAccounts()[0];

        if (!activeAccount) {
          setAccount(null);
          setLoading(false);
          return;
        }

        instance.setActiveAccount(activeAccount);
        await finalizeLogin(activeAccount);
      } catch (err: any) {
        console.error('MSAL init failed', err);
        setError('Unable to initialize authentication.');
        setLoading(false);
      }
    };

    init();
  }, []);

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

  const handleLogin = () => {
    const instance = msalInstanceRef.current;
    if (!instance) return;
    setError('');

    if (instance.getActiveAccount()) {
      finalizeLogin(instance.getActiveAccount() as AccountInfo);
      return;
    }

    setLoading(true);
    instance.loginRedirect(loginRequest).catch(err => {
      if (err?.errorCode === 'interaction_in_progress') {
        // Ignore duplicate clicks while redirect is in progress
        setLoading(false);
        return;
      }
      setLoading(false);
      setError(String(err?.message ?? err));
    });
  };

  const handleLogout = async () => {
    setError('');
    await clearBrowserCaches();
    setAccount(null);
    const instance = msalInstanceRef.current;
    if (!instance) return;
    instance
      .logoutRedirect({ account: instance.getActiveAccount() || undefined, postLogoutRedirectUri: window.location.origin })
      .catch(err => setError(String(err?.message ?? err)));
  };

  const finalizeLogin = async (principal: AccountInfo) => {
    setLoading(true);
    setError('');
    try {
      setAccount(principal);
      const azureName = principal.name || principal.username || '';
      const azureEmail = principal.username || '';
      const azureId = principal.homeAccountId || principal.localAccountId || '';

      const res = await fetch(apiUrl('/auth/azure-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azureId: azureId,
          email: azureEmail,
          name: azureName,
          identityProvider: principal.environment || 'aad',
          roles: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to authenticate with backend');
      }

      const apiUser = data.user as any;
      // Use user data from database (role comes from database, not Azure AD)
      const selectedUser: User = {
        id: apiUser.UserId,
        name: apiUser.Name,
        role: apiUser.Role as 'user' | 'manager' | 'admin',
        department: apiUser.Department || undefined,
        email: apiUser.Email || undefined,
        employeeId: apiUser.EmployeeId || undefined,
      };

      localStorage.setItem('currentUserId', selectedUser.id);
      localStorage.setItem('azureUser', JSON.stringify(principal));
      const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const updated = [selectedUser, ...existingUsers.filter(u => u.id !== selectedUser.id)];
      localStorage.setItem('users', JSON.stringify(updated));
      
      // Call onLogin to update parent component
      onLogin(selectedUser);
      
      // Mark as logged in and keep loading state to prevent flash of login UI
      setIsLoggedIn(true);
      setAccount(principal);
      // Keep loading true - parent will unmount this component when currentUser is set
      // This prevents showing the login UI after successful authentication
    } catch (err: any) {
      setError(String(err?.message ?? err));
      setAccount(null);
      setLoading(false);
    }
  };

  // If login is successful, let parent component render the dashboard
  if (isLoggedIn) {
    return null;
  }

  // Also check if user is already logged in (from localStorage)
  // This prevents showing login UI after redirect when parent hasn't updated yet
  const currentUserId = localStorage.getItem('currentUserId');
  if (currentUserId && account) {
    // User is logged in, don't show login UI
    return null;
  }

  // If we have an account but are still loading (finalizing login), show loading state
  if (loading || (account && !currentUserId)) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-md shadow p-6 text-center">
          <p className="text-base-content dark:text-dark-content">
            {account ? 'Completing sign in...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-md shadow p-6">
        <h1 className="text-2xl font-bold text-base-content dark:text-dark-content mb-6">
          Sign in to Kauvery Risk Register
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm">
            {error}
          </div>
        )}

        {!account ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 16 16" aria-hidden="true">
                <rect width="7" height="7" x="0" y="0" fill="#F35325" />
                <rect width="7" height="7" x="9" y="0" fill="#81BC06" />
                <rect width="7" height="7" x="0" y="9" fill="#05A6F0" />
                <rect width="7" height="7" x="9" y="9" fill="#FFBA08" />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Microsoft'}
            </button>
            <p className="text-sm text-base-content-muted dark:text-dark-content-muted text-center">
              Use your organizational account to sign in
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
              <p className="text-sm text-green-800 dark:text-green-200">
                Signed in as: <strong>{account.name || account.username}</strong>
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                {account.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AzureStaticWebAppsLogin;

