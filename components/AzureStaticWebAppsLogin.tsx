import React, { useEffect, useRef, useCallback } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { User } from '../types';
import { apiUrl } from '../api';
import { msalConfig, loginRequest } from '../msalConfig';

interface AzureStaticWebAppsLoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onLoginReady?: (loginFn: () => void, logoutFn: () => void) => void;
}

const AzureStaticWebAppsLogin: React.FC<AzureStaticWebAppsLoginProps> = ({ users: _users, onLogin, onLoginReady }) => {
  const msalInstanceRef = useRef<PublicClientApplication | null>(null);

  const clearMSALCache = useCallback(async (instance: PublicClientApplication) => {
    try {
      // Clear MSAL browser storage keys
      const clientId = msalConfig.auth.clientId;
      const keysToRemove: string[] = [];
      
      // Find all MSAL-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(`msal.${clientId}`) || key.startsWith('msal.'))) {
          keysToRemove.push(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith(`msal.${clientId}`) || key.startsWith('msal.'))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all MSAL keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (err) {
      console.warn('Error clearing MSAL cache:', err);
    }
  }, []);

  const finalizeLogin = useCallback(async (principal: AccountInfo) => {
    try {
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
      const selectedUser: User = {
        id: apiUser.UserId,
        name: apiUser.Name,
        role: apiUser.Role as 'user' | 'manager' | 'admin' | 'unit_head',
        department: apiUser.Department || undefined,
        email: apiUser.Email || undefined,
        employeeId: apiUser.EmployeeId || undefined,
        unit: apiUser.Unit || undefined,
        isUnitHead: Boolean(apiUser.IsUnitHead),
      };

      // Store all user data in localStorage (similar to sample code)
      localStorage.setItem('currentUserId', selectedUser.id);
      localStorage.setItem('userRole', selectedUser.role);
      localStorage.setItem('userName', selectedUser.name);
      if (selectedUser.email) {
        localStorage.setItem('email', selectedUser.email);
      }
      if (selectedUser.employeeId) {
        localStorage.setItem('employeeId', selectedUser.employeeId);
      }
      if (selectedUser.unit) {
        localStorage.setItem('unit_code', selectedUser.unit);
      }
      if (selectedUser.department) {
        localStorage.setItem('department', selectedUser.department);
      }
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('azureUser', JSON.stringify(principal));
      
      // Store in users array for App.tsx
      const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const updated = [selectedUser, ...existingUsers.filter(u => u.id !== selectedUser.id)];
      localStorage.setItem('users', JSON.stringify(updated));
      
      // Call onLogin - parent will update and route based on role
      onLogin(selectedUser);
    } catch (err: any) {
      console.error('Failed to finalize login:', err);
    }
  }, [onLogin]);

  const handleLogin = useCallback(() => {
    const instance = msalInstanceRef.current;
    if (!instance) return;

    const activeAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (activeAccount) {
      instance.setActiveAccount(activeAccount);
      finalizeLogin(activeAccount);
      return;
    }

    instance.loginRedirect(loginRequest).catch(err => {
      if (err?.errorCode !== 'interaction_in_progress') {
        console.error('Login error:', err);
      }
    });
  }, [finalizeLogin]);

  const handleLogout = useCallback(async () => {
    const instance = msalInstanceRef.current;
    if (!instance) return;
    
    try {
      // Get currentUserId before clearing
      const currentUserId = localStorage.getItem('currentUserId');
      
      // Clear all authentication-related localStorage items
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('email');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('unit_code');
      localStorage.removeItem('department');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('azureUser');
      
      // Clear user from users array
      if (currentUserId) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        localStorage.setItem('users', JSON.stringify(users.filter((u: User) => u.id !== currentUserId)));
      }
    } catch (err) {
      console.warn('Error clearing localStorage:', err);
    }

    instance
      .logoutRedirect({ 
        account: instance.getActiveAccount() || undefined, 
        postLogoutRedirectUri: window.location.origin 
      })
      .catch(err => console.error('Logout error:', err));
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const instance = new PublicClientApplication(msalConfig);
        msalInstanceRef.current = instance;
        if ((instance as any).initialize) {
          await (instance as any).initialize();
        }

        // Handle redirect response from Azure AD
        let redirectResponse;
        try {
          redirectResponse = await instance.handleRedirectPromise();
        } catch (redirectErr: any) {
          // Handle state mismatch - clear cache and retry
          if (redirectErr?.errorCode === 'state_mismatch' || redirectErr?.errorMessage?.includes('state_mismatch')) {
            console.warn('State mismatch detected, clearing cache and retrying...');
            try {
              // Clear MSAL cache
              await clearMSALCache(instance);
              // Clear localStorage auth data
              localStorage.removeItem('currentUserId');
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('azureUser');
              // Small delay before retry to ensure cache is cleared
              setTimeout(() => {
                instance.loginRedirect(loginRequest).catch(err => {
                  if (err?.errorCode !== 'interaction_in_progress') {
                    console.error('Retry login error:', err);
                  }
                });
              }, 100);
              return;
            } catch (clearErr) {
              console.error('Error clearing cache:', clearErr);
            }
          }
          
          // Handle SPA configuration error
          if (redirectErr?.errorCode === 'invalid_request' || 
              redirectErr?.errorMessage?.includes('AADSTS9002326') ||
              redirectErr?.errorMessage?.includes('Cross-origin token redemption')) {
            console.error('Azure AD Configuration Error: The app must be registered as a "Single-Page Application" (SPA) in Azure AD.');
            console.error('Please ensure:');
            console.error('1. App registration platform is set to "Single-page application"');
            console.error('2. Redirect URI matches exactly: ' + window.location.origin);
            console.error('3. Implicit grant and hybrid flows are enabled');
            // Try to continue with existing account if available
            const existingAccount = instance.getActiveAccount() || instance.getAllAccounts()[0];
            if (existingAccount) {
              instance.setActiveAccount(existingAccount);
              await finalizeLogin(existingAccount);
              return;
            }
          }
          
          // For other errors, log and continue
          console.error('Redirect promise error:', redirectErr);
        }
        
        const activeAccount =
          redirectResponse?.account ||
          instance.getActiveAccount() ||
          instance.getAllAccounts()[0];

        if (activeAccount) {
          instance.setActiveAccount(activeAccount);
          await finalizeLogin(activeAccount);
          // Don't set loading to false here - finalizeLogin will call onLogin
          // and parent will unmount this component
        } else {
          // No account found - check if user is already logged in via localStorage
          const currentUserId = localStorage.getItem('currentUserId');
          const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
          
          if (currentUserId && isAuthenticated) {
            // User is already authenticated - restore user state from localStorage
            const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
            const foundUser = existingUsers.find((u: User) => u.id === currentUserId);
            if (foundUser) {
              // Restore user state in App.tsx
              onLogin(foundUser);
              return;
            }
          }
          
          if (!currentUserId) {
            // No account and no localStorage user - automatically redirect to Azure login
            instance.loginRedirect(loginRequest).catch(err => {
              if (err?.errorCode !== 'interaction_in_progress') {
                console.error('Auto-login redirect error:', err);
              }
            });
          }
        }

        // Expose login/logout methods to parent
        if (onLoginReady) {
          onLoginReady(handleLogin, handleLogout);
        }
      } catch (err: any) {
        console.error('MSAL init failed', err);
      }
    };

    init();
  }, [finalizeLogin, handleLogin, handleLogout, onLoginReady, onLogin, clearMSALCache]);

  // This component is a handler only - no UI
  // It automatically redirects to Azure login if no account is found
  // After authentication, it calls onLogin and parent handles the dashboard
  return null;
};

export default AzureStaticWebAppsLogin;
