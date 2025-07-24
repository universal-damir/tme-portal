# Cookie Security Configuration Fix

## Problem
The TME Portal was setting session cookies with the "Secure" flag enabled for all environments where `NODE_ENV !== 'production'`. This prevented cookies from working over HTTP connections, making the application inaccessible on local networks (e.g., `192.168.97.149:3000`).

## Solution
Added a new environment variable `SECURE_COOKIES` to explicitly control cookie security settings, allowing for more flexible deployment scenarios.

## Changes Made

### 1. Environment Variable (.env.local)
```bash
# Set to false for local network access over HTTP (e.g., 192.168.x.x:3000)
SECURE_COOKIES=false
```

### 2. Security Library Enhancement (src/lib/security.ts)
Added new utility function:
```typescript
export function shouldUseSecureCookies(): boolean {
  // Check explicit SECURE_COOKIES environment variable first
  if (process.env.SECURE_COOKIES !== undefined) {
    return process.env.SECURE_COOKIES === 'true';
  }
  
  // Fall back to NODE_ENV check for backward compatibility
  return process.env.NODE_ENV === 'production';
}
```

### 3. Updated Authentication Routes
Updated the following files to use the new `shouldUseSecureCookies()` function:
- `/src/app/api/auth/login/route.ts`
- `/src/app/api/auth/session/route.ts`  
- `/src/app/api/auth/logout/route.ts`

## Configuration Options

### For Local Network Access (HTTP)
```bash
SECURE_COOKIES=false
```
This allows cookies to work over HTTP connections, enabling access from local network IPs.

### For Production/HTTPS
```bash
SECURE_COOKIES=true
```
This enforces secure cookies that only work over HTTPS connections.

### Default Behavior
If `SECURE_COOKIES` is not set, the system falls back to the original behavior:
- Secure cookies in production (`NODE_ENV=production`)
- Non-secure cookies in development

## Usage

1. **For local network testing**: Set `SECURE_COOKIES=false` in your `.env.local`
2. **For production deployment**: Set `SECURE_COOKIES=true` in your production environment
3. **For localhost development**: Either setting works, but `false` is more permissive

## Security Considerations

- Only disable secure cookies (`SECURE_COOKIES=false`) in trusted network environments
- Always use `SECURE_COOKIES=true` for production deployments over the internet
- The HttpOnly flag remains enabled for all cookies to prevent XSS attacks
- SameSite protection remains active for CSRF prevention

## Testing

After making these changes:
1. Restart your Next.js development server
2. Clear your browser cookies for the domain
3. Login again - cookies should now work over HTTP on your local network

The application has been successfully built and tested with these changes.