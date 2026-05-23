export const MOCK_USERS = {
  approved: {
    email: 'approved@test.com',
    displayName: 'Approved User',
    uid: 'mock-approved-uid',
  },
  pending: {
    email: 'pending@test.com',
    displayName: 'Pending User',
    uid: 'mock-pending-uid',
  },
  rejected: {
    email: 'rejected@test.com',
    displayName: 'Rejected User',
    uid: 'mock-rejected-uid',
  },
  revoked: {
    email: 'revoked@test.com',
    displayName: 'Revoked User',
    uid: 'mock-revoked-uid',
  },
  unrequested: {
    email: 'new@test.com',
    displayName: 'New User',
    uid: 'mock-new-uid',
  },
  admin: {
    email: 'gauravpatil9262@gmail.com', // Admin email based on useAuthStore
    displayName: 'Admin User',
    uid: 'mock-admin-uid',
  }
};

export const MOCK_ACCOUNT_STATUS = {
  'approved@test.com': 'approved',
  'pending@test.com': 'pending',
  'rejected@test.com': 'rejected',
  'revoked@test.com': 'revoked',
  'new@test.com': 'unrequested',
  'gauravpatil9262@gmail.com': 'approved',
};

// Playwright helper to inject mock state
export async function injectMockUser(page: any, userType: keyof typeof MOCK_USERS) {
  const user = MOCK_USERS[userType];
  const status = MOCK_ACCOUNT_STATUS[user.email as keyof typeof MOCK_ACCOUNT_STATUS];
  
  await page.addInitScript(`
    window.__E2E_MOCK_USER__ = ${JSON.stringify(user)};
    window.__E2E_MOCK_STATUS__ = "${status}";
    window.sessionStorage.setItem('myfit-auth-storage', JSON.stringify({
      state: {
        user: ${JSON.stringify(user)},
        authStatus: "${status === 'approved' ? 'success' : (status === 'unrequested' ? 'idle' : 'error')}",
        error: ${status === 'approved' || status === 'unrequested' ? 'null' : `"${status}"`},
        isInitialAuthReady: true,
        requestPayload: ${status !== 'approved' ? JSON.stringify({ email: user.email, displayName: user.displayName, timestamp: Date.now() }) : 'null'}
      },
      version: 0
    }));
  `);
}

export async function clearMockUser(page: any) {
  await page.addInitScript(`
    window.__E2E_MOCK_USER__ = null;
    window.__E2E_MOCK_STATUS__ = null;
    window.sessionStorage.removeItem('myfit-auth-storage');
  `);
}
