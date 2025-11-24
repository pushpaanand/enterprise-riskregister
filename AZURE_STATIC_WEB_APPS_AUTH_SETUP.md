# Azure Static Web Apps Authentication Setup

## Overview

Azure Static Web Apps provides **built-in authentication** that's much simpler than implementing MSAL directly. You just need to configure it in Azure Portal and use the provided endpoints.

## Authentication Endpoints

Azure Static Web Apps provides these endpoints automatically:

| Provider | Login | Logout |
|----------|-------|--------|
| **Entra ID (Azure AD)** | `/.auth/login/aad` | `/.auth/logout` |
| **GitHub** | `/.auth/login/github` | `/.auth/logout` |
| **Get User Info** | `/.auth/me` | - |

## Step-by-Step Setup

### Step 1: Configure Authentication in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **Static Web App** resource
3. In the left menu, click **Authentication**
4. Click **Add identity provider**
5. Select **Microsoft** (for Entra ID/Azure AD)
6. Configure:
   - **App registration type**: 
     - **Create new app registration** (recommended for first time)
     - OR **Use existing app registration** (if you already have one)
   - If creating new:
     - **Name**: Your app name
     - **Supported account types**: 
       - **Current tenant** (single tenant)
       - **Any Azure AD directory** (multi-tenant)
   - **Restrict access**: 
     - **Allow unauthenticated requests** (if you want public access)
     - **Require authentication** (if you want only authenticated users)
7. Click **Add**

### Step 2: Configure App Registration (if needed)

If you chose "Create new app registration", Azure will create it automatically. If you need to customize:

1. Go to **Azure Active Directory** → **App registrations**
2. Find your app (it will have the name you specified)
3. Go to **Authentication**
4. Add redirect URI:
   - Type: **Single-page application**
   - URI: `https://your-static-web-app.azurestaticapps.net/.auth/login/aad/callback`
5. Save

### Step 3: Update Your Frontend Code

Replace your Login component with the Azure Static Web Apps login:

**In `App.tsx`:**

```tsx
import AzureStaticWebAppsLogin from './components/AzureStaticWebAppsLogin';

// Replace the Login component usage:
{!currentUser && (
  <AzureStaticWebAppsLogin users={users} onLogin={handleLoggedIn} />
)}
```

### Step 4: Update Backend API

The backend endpoint `/api/auth/azure-login` will receive:
- `azureId`: User's Azure AD ID
- `email`: User's email
- `name`: User's display name
- `identityProvider`: "aad" for Azure AD
- `roles`: Array of Azure AD roles (if configured)

## How It Works

1. **User clicks "Sign in with Microsoft"**
   - Redirects to `/.auth/login/aad`
   - Azure handles the OAuth flow
   - User signs in with their Microsoft account
   - Redirects back to your app

2. **Get User Info**
   - Call `/.auth/me` to get current user
   - Returns `clientPrincipal` object with user details

3. **Logout**
   - Redirect to `/.auth/logout`
   - Clears authentication session

## User Info Structure

When you call `/.auth/me`, you get:

```json
{
  "clientPrincipal": {
    "identityProvider": "aad",
    "userId": "user-id-from-azure",
    "userDetails": "user@example.com",
    "userRoles": ["authenticated", "admin"]
  }
}
```

## Role Assignment

You can assign roles in Azure AD:

1. Go to your **Static Web App** → **Authentication**
2. Click on your identity provider
3. Under **App registration**, click **Manage**
4. In App Registration, go to **App roles**
5. Create roles (e.g., "admin", "manager", "user")
6. Assign users to roles in **Enterprise applications** → **Users and groups**

## Environment-Specific Configuration

### Development (Local)

For local development, you can:
1. Use the same endpoints (they'll work if you're running on Azure)
2. OR use a mock authentication for testing

### Production

The authentication endpoints work automatically when deployed to Azure Static Web Apps.

## Security Notes

- ✅ No client secrets needed (handled by Azure)
- ✅ OAuth 2.0 with PKCE automatically
- ✅ Secure token storage
- ✅ Automatic token refresh

## Troubleshooting

### "Authentication not configured"
- Ensure you've added the identity provider in Azure Portal
- Check that the app registration is properly configured

### "User not found after login"
- Check that `/.auth/me` is returning user data
- Verify your backend `/api/auth/azure-login` endpoint is working
- Check browser console for errors

### "Roles not appearing"
- Ensure roles are created in App Registration
- Verify users are assigned to roles
- Check that roles are included in the token

## Next Steps

1. Configure authentication in Azure Portal
2. Update your Login component to use `AzureStaticWebAppsLogin`
3. Test the login flow
4. Configure roles in Azure AD if needed
5. Update backend to map Azure users to your database

## Files Created

- `components/AzureStaticWebAppsLogin.tsx` - Login component using Azure Static Web Apps auth
- `server-next/app/api/auth/azure-login/route.ts` - Backend endpoint (already exists)

## Benefits Over MSAL

- ✅ No MSAL packages needed
- ✅ No configuration files
- ✅ Automatic token management
- ✅ Built-in security
- ✅ Works out of the box on Azure Static Web Apps

