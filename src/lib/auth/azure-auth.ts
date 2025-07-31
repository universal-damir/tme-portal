/**
 * Azure AD authentication for Microsoft Graph API
 * Handles user authentication and token management
 */

import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';

// MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

// Required Graph API scopes
const GRAPH_SCOPES = [
  'User.Read',
  'Mail.ReadWrite',
  'Mail.Send',
];

// MSAL instance
let msalInstance: PublicClientApplication | null = null;

// Initialize MSAL instance
export const initializeMsal = () => {
  if (typeof window !== 'undefined' && !msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
};

// Sign in user and get access token
export const signInAndGetToken = async (): Promise<string> => {
  const msal = initializeMsal();
  if (!msal) throw new Error('MSAL not initialized');

  try {
    // Try to get token silently first
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
      const silentRequest = {
        scopes: GRAPH_SCOPES,
        account: accounts[0],
      };

      try {
        const response = await msal.acquireTokenSilent(silentRequest);
        return response.accessToken;
      } catch (silentError) {
        console.log('Silent token acquisition failed, falling back to interactive');
      }
    }

    // If silent token acquisition fails, use interactive
    const loginRequest = {
      scopes: GRAPH_SCOPES,
      prompt: 'select_account',
    };

    const response = await msal.loginPopup(loginRequest);
    return response.accessToken;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw new Error('Failed to authenticate with Microsoft Graph');
  }
};

// Get cached access token if available
export const getCachedToken = async (): Promise<string | null> => {
  const msal = initializeMsal();
  if (!msal) return null;

  try {
    const accounts = msal.getAllAccounts();
    if (accounts.length === 0) return null;

    const silentRequest = {
      scopes: GRAPH_SCOPES,
      account: accounts[0],
    };

    const response = await msal.acquireTokenSilent(silentRequest);
    return response.accessToken;
  } catch (error) {
    console.log('No cached token available');
    return null;
  }
};

// Sign out user
export const signOut = async (): Promise<void> => {
  const msal = initializeMsal();
  if (!msal) return;

  try {
    await msal.logoutPopup();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const msal = initializeMsal();
  if (!msal) return false;

  const accounts = msal.getAllAccounts();
  return accounts.length > 0;
};