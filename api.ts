// Central API base URL and helper
export const API_BASE_URL: string =
  // Vite-style env
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  // Fallback to localhost during development
  'https://riskmanagement-ggb0ard8ekbmfjab.southindia-01.azurewebsites.net/api';

export const apiUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};


