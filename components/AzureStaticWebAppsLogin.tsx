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
      };

      localStorage.setItem('currentUserId', selectedUser.id);
      localStorage.setItem('azureUser', JSON.stringify(principal));
      const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const updated = [selectedUser, ...existingUsers.filter(u => u.id !== selectedUser.id)];
      localStorage.setItem('users', JSON.stringify(updated));
      
      // Call onLogin - parent will update and this component will unmount
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
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('azureUser');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUserId = localStorage.getItem('currentUserId');
      if (currentUserId) {
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
        const redirectResponse = await instance.handleRedirectPromise();
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
  }, [finalizeLogin, handleLogin, handleLogout, onLoginReady]);

  // This component is a handler only - no UI
  // It automatically redirects to Azure login if no account is found
  // After authentication, it calls onLogin and parent handles the dashboard
  return null;
};

export default AzureStaticWebAppsLogin;
