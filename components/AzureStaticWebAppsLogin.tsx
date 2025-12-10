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
  const initRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);

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

      if (!data.user) {
        throw new Error('No user data returned from backend');
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
      
      console.log('✅ Login successful:', selectedUser.name, selectedUser.role);
      
      // Call onLogin - parent will update and route based on role
      onLogin(selectedUser);
    } catch (err: any) {
      console.error('❌ Failed to finalize login:', err?.message || err);
      // Clear any partial data
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('isAuthenticated');
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
    // Prevent multiple initializations
    if (initRef.current || processingRef.current) {
      return;
    }

    const init = async () => {
      // Check if user is already logged in from localStorage first
      const currentUserId = localStorage.getItem('currentUserId');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      if (currentUserId && isAuthenticated) {
        const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const foundUser = existingUsers.find((u: User) => u.id === currentUserId);
        if (foundUser) {
          console.log('✅ User already authenticated, restoring from localStorage');
          onLogin(foundUser);
          initRef.current = true;
          return;
        }
      }

      if (processingRef.current) {
        return;
      }
      processingRef.current = true;

      try {
        // Only create instance if not already created
        if (!msalInstanceRef.current) {
          const instance = new PublicClientApplication(msalConfig);
          msalInstanceRef.current = instance;
          if ((instance as any).initialize) {
            await (instance as any).initialize();
          }
        }
        const instance = msalInstanceRef.current;

        // Handle redirect response from Azure AD (only once)
        let redirectResponse = null;
        try {
          redirectResponse = await instance.handleRedirectPromise();
          if (redirectResponse?.account) {
            console.log('✅ Redirect response received with account:', redirectResponse.account.username);
          }
        } catch (redirectErr: any) {
          // Only log state mismatch, don't retry if user is already logged in
          if (redirectErr?.errorCode === 'state_mismatch' || redirectErr?.errorMessage?.includes('state_mismatch')) {
            console.warn('⚠️ State mismatch detected (this can happen on page refresh)');
            // Check again if user is authenticated (might have been set during redirect)
            const checkUserId = localStorage.getItem('currentUserId');
            const checkAuth = localStorage.getItem('isAuthenticated') === 'true';
            if (checkUserId && checkAuth) {
              console.log('User already authenticated, ignoring state mismatch');
              const existingUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
              const foundUser = existingUsers.find((u: User) => u.id === checkUserId);
              if (foundUser) {
                onLogin(foundUser);
              }
              processingRef.current = false;
              return;
            }
          } else if (redirectErr?.errorCode === 'invalid_request' || 
                     redirectErr?.errorMessage?.includes('AADSTS9002326')) {
            console.error('❌ Azure AD SPA Configuration Error - App must be registered as SPA');
          } else {
            console.error('❌ Redirect error:', redirectErr?.errorCode || redirectErr?.message);
          }
        }
        
        // Check for active account
        const activeAccount =
          redirectResponse?.account ||
          instance.getActiveAccount() ||
          instance.getAllAccounts()[0];

        if (activeAccount) {
          console.log('✅ Active account found, finalizing login...');
          instance.setActiveAccount(activeAccount);
          await finalizeLogin(activeAccount);
          initRef.current = true;
          processingRef.current = false;
          return;
        }

        // No account - only redirect if not already logged in
        const checkUserId = localStorage.getItem('currentUserId');
        if (!checkUserId) {
          console.log('🚀 No account found, redirecting to Azure login...');
          instance.loginRedirect(loginRequest).catch(err => {
            if (err?.errorCode !== 'interaction_in_progress') {
              console.error('Login redirect error:', err?.errorCode || err?.message);
            }
          });
        }

        // Expose login/logout methods to parent
        if (onLoginReady) {
          onLoginReady(handleLogin, handleLogout);
        }
        
        initRef.current = true;
      } catch (err: any) {
        console.error('❌ MSAL init failed:', err?.message || err);
      } finally {
        processingRef.current = false;
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
