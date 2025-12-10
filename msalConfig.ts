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
    // Ensure this is configured as SPA in Azure AD
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    // Handle state mismatch errors
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === 0) console.error('MSAL Error:', message);
        else if (level === 1) console.warn('MSAL Warning:', message);
      },
      logLevel: 1, // Warning level
    },
  },
};

export const loginRequest: RedirectRequest = {
  scopes: ['User.Read'],
};

