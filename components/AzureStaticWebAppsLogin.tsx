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
    // Check if we're returning from a forced logout before login
    const forceFreshLogin = sessionStorage.getItem('forceFreshLogin');
    const pendingLoginUrl = sessionStorage.getItem('pendingLoginUrl');
    
    if (forceFreshLogin === 'true' && pendingLoginUrl) {
      // We just completed a logout, now redirect to login
      sessionStorage.removeItem('forceFreshLogin');
      sessionStorage.removeItem('pendingLoginUrl');
      sessionStorage.setItem('azureLoginInProgress', 'true');
      console.log('Redirecting to fresh login after forced logout');
      window.location.href = pendingLoginUrl;
      return;
    }
    
    // Add a small delay to ensure Azure has finished processing the redirect
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Also check auth when returning from Azure login (if login was in progress)
  useEffect(() => {
    const loginInProgress = sessionStorage.getItem('azureLoginInProgress');
    const userLoggedOut = sessionStorage.getItem('userLoggedOut');
    
    // Don't auto-login if user was logged out
    if (userLoggedOut === 'true') {
      sessionStorage.removeItem('azureLoginInProgress');
      setLoading(false);
      return;
    }
    
    if (loginInProgress === 'true') {
      // We're returning from Azure login, check auth after a delay
      const timer = setTimeout(async () => {
        try {
          // Double-check userLoggedOut flag before proceeding
          const stillLoggedOut = sessionStorage.getItem('userLoggedOut');
          if (stillLoggedOut === 'true') {
            sessionStorage.removeItem('azureLoginInProgress');
            setLoading(false);
            return;
          }
          
          // CRITICAL: Check if currentUserId exists - if not, don't auto-login
          // This prevents auto-login after logout even if Azure session exists
          const currentUserId = localStorage.getItem('currentUserId');
          if (!currentUserId) {
            // No currentUserId means user logged out - don't auto-login
            console.log('No currentUserId found - user was logged out, not auto-logging in');
            sessionStorage.removeItem('azureLoginInProgress');
            setLoading(false);
            return;
          }
          
          const res = await fetch('/.auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data && data.clientPrincipal) {
              // Double-check currentUserId again before proceeding
              const stillNoUserId = !localStorage.getItem('currentUserId');
              if (stillNoUserId) {
                console.log('currentUserId still missing - not auto-logging in');
                sessionStorage.removeItem('azureLoginInProgress');
                setLoading(false);
                return;
              }
              
              // User authenticated with Azure AND has currentUserId, proceed with login
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
      // Check if we're in the middle of a forced fresh login flow
      const forceFreshLogin = sessionStorage.getItem('forceFreshLogin');
      if (forceFreshLogin === 'true') {
        // Don't check auth yet, wait for the redirect to login
        setLoading(false);
        return;
      }
      
      // Check if user explicitly logged out - don't auto-login in this case
      const userLoggedOut = sessionStorage.getItem('userLoggedOut');
      if (userLoggedOut === 'true') {
        // User explicitly logged out, clear Azure user state and don't auto-login
        setAzureUser(null);
        // Clear any cached Azure data
        localStorage.removeItem('azureUser');
        // Don't remove userLoggedOut flag here - keep it until user explicitly tries to login
        sessionStorage.removeItem('azureLoginInProgress');
        setLoading(false);
        return;
      }
      
      // Also check if currentUserId was cleared (logout happened)
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        // No currentUserId means user logged out, don't auto-login even if Azure auth exists
        // Clear Azure user state to prevent showing "signed in" message
        setAzureUser(null);
        localStorage.removeItem('azureUser');
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
          // Only set azureUser if we have currentUserId (user is logged in to our app)
          if (currentUserId) {
            setAzureUser(data.clientPrincipal);
            // User is already logged in to our app
            sessionStorage.removeItem('azureLoginInProgress');
            setLoading(false);
            return;
          }
          
          // Azure auth exists but no currentUserId - user needs to click sign in
          // Don't set azureUser state to prevent showing "signed in" message
          // This forces them to click the sign in button
          setAzureUser(null);
          sessionStorage.removeItem('azureLoginInProgress');
          setLoading(false);
        } else {
          // No Azure authentication
          setAzureUser(null);
          localStorage.removeItem('azureUser');
          sessionStorage.removeItem('azureLoginInProgress');
          setLoading(false);
        }
      } else {
        // No Azure authentication
        setAzureUser(null);
        localStorage.removeItem('azureUser');
        sessionStorage.removeItem('azureLoginInProgress');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Auth check failed:', err);
      setAzureUser(null);
      localStorage.removeItem('azureUser');
      sessionStorage.removeItem('azureLoginInProgress');
      setLoading(false);
    }
  };

  const buildLoginUrl = () => {
    const redirectUri = window.location.origin;
    const nonce = Date.now();
    return `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(redirectUri)}&prompt=login&nonce=${nonce}`;
  };

  const handleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setError('');
    
    // Check if user was logged out - if so, always force fresh Azure login
    const userLoggedOut = sessionStorage.getItem('userLoggedOut');
    
    // If user was logged out, we need to force a fresh Azure login
    // Even if Azure session still exists, we want to go through the login flow again
    if (userLoggedOut === 'true') {
      // Clear the logged out flag since user is explicitly trying to login
      sessionStorage.removeItem('userLoggedOut');
      
      // Clear any cached Azure user state
      setAzureUser(null);
      localStorage.removeItem('azureUser');
      localStorage.removeItem('currentUserId');
      
      // Clear users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      localStorage.setItem('users', JSON.stringify([]));

      // First, ensure Azure session is fully cleared by calling logout again
      // Then redirect to login page
      // This ensures we get a fresh login even if Azure session persists
      const loginUrl = buildLoginUrl();

      // First logout to clear any remaining Azure session, then redirect to login
      // We'll use a two-step process: logout -> login
      sessionStorage.setItem('forceFreshLogin', 'true');
      sessionStorage.setItem('pendingLoginUrl', loginUrl);
      
      // Redirect to logout first to ensure session is cleared
      const redirectUri = window.location.origin;
      const logoutUrl = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}&nonce=${Date.now()}`;
      console.log('User was logged out - clearing Azure session first, then will login:', logoutUrl);
      window.location.href = logoutUrl;
      return;
    }
    
    // If user wasn't logged out, check if Azure auth already exists
    if (azureUser) {
      // ALWAYS check currentUserId - if not, redirect to login (don't auto-login)
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        // No currentUserId means user was logged out - redirect to login page
        console.log('Azure user exists but no currentUserId - redirecting to login');
        sessionStorage.setItem('azureLoginInProgress', 'true');
        const loginUrl = buildLoginUrl();
        window.location.href = loginUrl;
        return;
      }
      // User is already authenticated with Azure and has currentUserId, proceed with login
      handleAzureLogin(azureUser);
      return;
    }
    
    // Check if Azure session exists but we don't have it in state
    try {
      const res = await fetch('/.auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data && data.clientPrincipal) {
          // CRITICAL: Check if currentUserId exists - if not, redirect to login (don't auto-login)
          const currentUserId = localStorage.getItem('currentUserId');
          if (!currentUserId) {
            // Azure session exists but no currentUserId - user was logged out
            // Redirect to login page to force fresh login
            console.log('Azure session exists but no currentUserId - redirecting to login');
            sessionStorage.setItem('azureLoginInProgress', 'true');
            const loginUrl = buildLoginUrl();
            window.location.href = loginUrl;
            return;
          }
          // Azure session exists and user has currentUserId, use it
          setAzureUser(data.clientPrincipal);
          await handleAzureLogin(data.clientPrincipal);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking Azure auth:', err);
    }
    
    // No Azure session exists, redirect to Azure login
    sessionStorage.setItem('azureLoginInProgress', 'true');
    const loginUrl = buildLoginUrl();
    console.log('Redirecting to Azure login:', loginUrl);
    window.location.href = loginUrl;
  };

  const handleLogout = () => {
    // Get currentUserId before clearing it
    const currentUserId = localStorage.getItem('currentUserId');
    
    // Clear ALL local storage data related to authentication
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('azureUser');
    
    // Clear users array to remove cached user data
    if (currentUserId) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.filter((u: any) => u.id !== currentUserId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
    
    // Clear state
    setAzureUser(null);
    
    // Mark that user explicitly logged out - prevents auto-login
    // This flag will persist until user explicitly clicks sign in
    sessionStorage.setItem('userLoggedOut', 'true');
    
    // Clear any login in progress flags
    sessionStorage.removeItem('azureLoginInProgress');
    
    // Redirect to Azure Static Web Apps logout endpoint
    // Use post_logout_redirect_uri to redirect back to home page after logout
    // Add a timestamp parameter to force cache busting
    const homePageUrl = window.location.origin;
    const timestamp = new Date().getTime();
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(homePageUrl)}&_=${timestamp}`;
  };

  const handleAzureLogin = async (principal: AzureUser) => {
    // Double-check userLoggedOut flag before proceeding
    const userLoggedOut = sessionStorage.getItem('userLoggedOut');
    if (userLoggedOut === 'true') {
      // User was logged out, don't proceed with login
      console.log('User was logged out - blocking auto-login');
      setAzureUser(null);
      setLoading(false);
      return;
    }
    
    // CRITICAL: Check if currentUserId exists - if not, user was logged out
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
      console.log('No currentUserId - user was logged out, blocking auto-login');
      setAzureUser(null);
      setLoading(false);
      return;
    }
    
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

      // Check again before setting localStorage
      const stillLoggedOut = sessionStorage.getItem('userLoggedOut');
      if (stillLoggedOut === 'true') {
        console.log('UserLoggedOut flag still set - blocking login');
        setAzureUser(null);
        setLoading(false);
        return;
      }
      
      // Double-check currentUserId - if it was cleared during the API call, don't login
      const currentUserIdCheck = localStorage.getItem('currentUserId');
      if (!currentUserIdCheck) {
        console.log('currentUserId was cleared during API call - blocking login');
        setAzureUser(null);
        setLoading(false);
        return;
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
      
      // Clear the logged out flag since login was successful
      sessionStorage.removeItem('userLoggedOut');
      
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

