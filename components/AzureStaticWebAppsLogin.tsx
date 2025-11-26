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

const AzureStaticWebAppsLogin: React.FC<AzureStaticWebAppsLoginProps> = ({ users, onLogin }) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [azureUser, setAzureUser] = useState<AzureUser | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    // Add a small delay to ensure Azure has finished processing the redirect
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Also check auth when returning from Azure login (if login was in progress)
  useEffect(() => {
    const loginInProgress = sessionStorage.getItem('azureLoginInProgress');
    if (loginInProgress === 'true') {
      // We're returning from Azure login, check auth after a delay
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/.auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data && data.clientPrincipal) {
              // User authenticated with Azure, proceed with login
              setAzureUser(data.clientPrincipal);
              sessionStorage.removeItem('azureLoginInProgress');
              await handleAzureLogin(data.clientPrincipal);
            } else {
              sessionStorage.removeItem('azureLoginInProgress');
              setLoading(false);
            }
          } else {
            sessionStorage.removeItem('azureLoginInProgress');
            setLoading(false);
          }
        } catch (err) {
          console.error('Post-login auth check failed:', err);
          sessionStorage.removeItem('azureLoginInProgress');
          setLoading(false);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user explicitly logged out - don't auto-login in this case
      const userLoggedOut = sessionStorage.getItem('userLoggedOut');
      if (userLoggedOut === 'true') {
        // User explicitly logged out, clear Azure user state and don't auto-login
        setAzureUser(null);
        // Don't remove userLoggedOut flag here - keep it until user explicitly tries to login
        sessionStorage.removeItem('azureLoginInProgress');
        setLoading(false);
        return;
      }
      
      // Also check if currentUserId was cleared (logout happened)
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        // No currentUserId means user logged out, don't auto-login even if Azure auth exists
        setAzureUser(null);
        sessionStorage.removeItem('azureLoginInProgress');
        setLoading(false);
        return;
      }
      
      // Azure Static Web Apps provides user info at /.auth/me
      const res = await fetch('/.auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data && data.clientPrincipal) {
          // User is authenticated with Azure
          setAzureUser(data.clientPrincipal);
          
          // Only auto-login if we have a currentUserId (user was previously logged in)
          if (currentUserId) {
            // User is already logged in to our app
            sessionStorage.removeItem('azureLoginInProgress');
            setLoading(false);
            return;
          }
          
          // Azure auth exists but no currentUserId - user needs to click sign in
          // Don't auto-login, just show the login button
          sessionStorage.removeItem('azureLoginInProgress');
          setLoading(false);
        } else {
          // No Azure authentication
          setAzureUser(null);
          sessionStorage.removeItem('azureLoginInProgress');
          setLoading(false);
        }
      } else {
        // No Azure authentication
        setAzureUser(null);
        sessionStorage.removeItem('azureLoginInProgress');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Auth check failed:', err);
      setAzureUser(null);
      sessionStorage.removeItem('azureLoginInProgress');
      setLoading(false);
    }
  };

  const handleLogin = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setError('');
    
    // Clear the logged out flag since user is explicitly trying to login
    sessionStorage.removeItem('userLoggedOut');
    
    // Check if Azure auth already exists - if so, proceed with login directly
    if (azureUser) {
      // User is already authenticated with Azure, just need to log them into our app
      handleAzureLogin(azureUser);
      return;
    }
    
    // Mark that we're initiating a login redirect
    sessionStorage.setItem('azureLoginInProgress', 'true');
    
    // Redirect to Azure Static Web Apps login endpoint
    // Include post_login_redirect_uri to redirect back to home page after authentication
    // Use just the origin for redirect URI (Azure Static Web Apps best practice)
    const redirectUri = window.location.origin;
    const loginUrl = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('Redirecting to Azure login:', loginUrl);
    // Use href instead of replace to ensure proper navigation
    // This will cause a full page navigation, so the component will unmount
    window.location.href = loginUrl;
  };

  const handleLogout = () => {
    // Clear local storage first
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('azureUser');
    setAzureUser(null);
    
    // Mark that user explicitly logged out - prevents auto-login
    sessionStorage.setItem('userLoggedOut', 'true');
    
    // Redirect to Azure Static Web Apps logout endpoint
    // Include post_logout_redirect_uri to redirect back to home page after logout
    const homePageUrl = window.location.origin;
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(homePageUrl)}`;
  };

  const handleAzureLogin = async (principal: AzureUser) => {
    setLoading(true);
    setError('');
    try {
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
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine role from Azure AD roles
  const determineRoleFromAzureRoles = (roles: string[]): 'user' | 'manager' | 'admin' => {
    if (!roles || roles.length === 0) return 'user';
    
    // Check if user has admin role in Azure AD
    if (roles.some(r => r.toLowerCase().includes('admin'))) {
      return 'admin';
    }
    
    // Check if user has manager role in Azure AD
    if (roles.some(r => r.toLowerCase().includes('manager'))) {
      return 'manager';
    }
    
    return 'user';
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

