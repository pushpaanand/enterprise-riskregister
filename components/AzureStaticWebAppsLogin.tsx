import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiUrl } from '../api';

interface AzureStaticWebAppsLoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

interface AzureUser {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

const AzureStaticWebAppsLogin: React.FC<AzureStaticWebAppsLoginProps> = ({ users: _users, onLogin }) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [azureUser, setAzureUser] = useState<AzureUser | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const init = async () => {
      await checkAuth();
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

  const checkAuth = async () => {
    try {
      setLoading(true);
      const cacheBuster = Date.now();
      const res = await fetch(`/.auth/me?ts=${cacheBuster}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (!res.ok) {
        setAzureUser(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const principal = data?.clientPrincipal;

      if (principal) {
        await handleAzureLogin(principal);
      } else {
        setAzureUser(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Auth check failed:', err);
      setAzureUser(null);
      setError('Unable to verify Azure authentication. Please try signing in again.');
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setError('');
    const redirectUri = window.location.origin;
    const loginUrl = new URL(`/.auth/login/aad`, window.location.origin);
    loginUrl.searchParams.set('post_login_redirect_uri', redirectUri);
    loginUrl.searchParams.set('prompt', 'login');
    loginUrl.searchParams.set('max_age', '0');
    window.location.href = loginUrl.toString();
  };

  const handleLogout = async () => {
    setError('');
    await clearBrowserCaches();
    setAzureUser(null);
    const homePageUrl = window.location.origin;
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(homePageUrl)}`;
  };

  const handleAzureLogin = async (principal: AzureUser) => {
    setLoading(true);
    setError('');
    try {
      setAzureUser(principal);
      // Extract user information from Azure AD
      const azureName = principal.userDetails || principal.userId || '';
      const azureEmail = principal.userDetails || '';
      const azureId = principal.userId || '';

      // Map Azure AD user to your database user
      // Call your backend API to get or create user
      const res = await fetch(apiUrl('/auth/azure-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azureId: azureId,
          email: azureEmail,
          name: azureName,
          identityProvider: principal.identityProvider,
          roles: principal.userRoles || [],
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
      
      onLogin(selectedUser);
    } catch (err: any) {
      setError(String(err?.message ?? err));
      setAzureUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-md shadow p-6 text-center">
          <p className="text-base-content dark:text-dark-content">Checking authentication...</p>
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

        {!azureUser ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.5 5.5c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm-9 0c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zM10 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
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
                Signed in as: <strong>{azureUser.userDetails || azureUser.userId}</strong>
              </p>
              {azureUser.userRoles && azureUser.userRoles.length > 0 && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Roles: {azureUser.userRoles.join(', ')}
                </p>
              )}
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

