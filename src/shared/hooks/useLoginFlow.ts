import { useState } from 'react';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { submitAccessRequest } from '@/app/actions/accessRequests';

export function useLoginFlow() {
  const login = useAuthStore(state => state.login);
  const error = useAuthStore(state => state.error);
  const logout = useAuthStore(state => state.logout);
  const clearError = useAuthStore(state => state.clearError);
  const authStatus = useAuthStore(state => state.authStatus);
  const requestPayload = useAuthStore(state => state.requestPayload);
  const clearRequestPayload = useAuthStore(state => state.clearRequestPayload);
  
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'duplicate'>('idle');
  const [statusMessage, setStatusMessage] = useState("");

  const handleSwitchAccount = async () => {
    await logout();
    clearError();
    clearRequestPayload();
    setTimeout(() => {
      login();
    }, 250);
  };

  const handleRequestAccess = async () => {
    if (!requestPayload) return;
    setIsRequesting(true);
    const result = await submitAccessRequest(requestPayload);
    setIsRequesting(false);
    
    if (result.success) {
      setRequestStatus('success');
      setStatusMessage("✓ Request Submitted");
    } else if (result.error.includes("already submitted") || result.rateLimited) {
      setRequestStatus('duplicate');
      setStatusMessage(result.error);
    }
    
    setTimeout(() => {
      setRequestStatus('idle');
      if (result.success) {
         clearRequestPayload();
         clearError();
      }
    }, 4000);
  };

  const isAuthLoading = authStatus === 'loading' || authStatus === 'success';

  return {
    login,
    error,
    authStatus,
    clearError,
    clearRequestPayload,
    isRequesting,
    requestStatus,
    statusMessage,
    handleSwitchAccount,
    handleRequestAccess,
    isAuthLoading
  };
}
