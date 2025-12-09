import { Configuration, RedirectRequest } from '@azure/msal-browser';

// const env = (import.meta as any)?.env || {};
const env       = (import.meta as unknown as { env: Record<string, string> })?.env || {};
const tenantId  = env.VITE_AAD_TENANT_ID  || '767a4f7b-5957-4143-8bd4-b152154fe7f6';
const clientId  = env.VITE_AAD_CLIENT_ID  || 'bb140565-7dd0-4f93-8336-b2b4bb843580';
const redirectUri = env.VITE_AAD_REDIRECT_URI || window.location.origin || 'https://riskregister.kauverykonnect.com';

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

