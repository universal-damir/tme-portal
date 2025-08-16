/**
 * Debug utilities for SharedClientContext workflow
 * 
 * Usage in browser console:
 * - Enable debugging: enableSharedContextDebug()
 * - Disable debugging: disableSharedContextDebug()
 * - Check current state: getSharedContextDebugState()
 */

export const enableSharedContextDebug = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('DEBUG_SHARED_CONTEXT', 'true');
    console.log('🔍 SharedContext debugging ENABLED. Refresh the page to see debug logs.');
    console.log('To disable, run: disableSharedContextDebug()');
    return true;
  }
  return false;
};

export const disableSharedContextDebug = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('DEBUG_SHARED_CONTEXT');
    console.log('🔍 SharedContext debugging DISABLED. Refresh the page to stop debug logs.');
    return true;
  }
  return false;
};

export const getSharedContextDebugState = () => {
  if (typeof window !== 'undefined') {
    const isEnabled = localStorage.getItem('DEBUG_SHARED_CONTEXT') === 'true';
    console.log(`🔍 SharedContext debugging is currently: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
    return isEnabled;
  }
  return false;
};

// Make functions available globally in browser
if (typeof window !== 'undefined') {
  (window as any).enableSharedContextDebug = enableSharedContextDebug;
  (window as any).disableSharedContextDebug = disableSharedContextDebug;
  (window as any).getSharedContextDebugState = getSharedContextDebugState;
}