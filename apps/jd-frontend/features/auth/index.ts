export { AuthProvider, useAuth } from './components/auth.context';
export {
  AuthModalProvider,
  useAuthModal,
} from './components/auth-modal.context';
export {
  login,
  register,
  logout,
  createGuestSession,
  refreshSession,
  forgotPassword,
  resetPassword,
  createAuthErrorResponse,
  clearSessionOnError,
} from './api/auth.service';
export { LoginModal } from './components/LoginModal';
export { requireAuth } from './services/require-auth';
export { getSessionResponse } from './services/get-session';
export { getAccessToken, getRefreshToken } from './services/cookies';
export {
  extractWrappedMagentoAccessToken,
  validateRefreshToken,
} from './services/session-tokens';
export type {
  AuthTokens,
  AuthUser,
  AuthResponse,
  GuestAuthResponse,
  AuthProviderLoginResult,
  AuthProviderGuestSessionResult,
} from './types';
