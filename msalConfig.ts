import { Configuration, RedirectRequest } from '@azure/msal-browser';

// const env = (import.meta as any)?.env || {};
const tenantId = process.env.VITE_AAD_TENANT_ID || '';
const clientId = process.env.VITE_AAD_CLIENT_ID || '';
const redirectUri = process.env.VITE_AAD_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};

export const loginRequest: RedirectRequest = {
  scopes: ['User.Read'],
};

