'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountScaffold } from '../components/AccountScaffold';
import { AccountSkeleton } from '../components/AccountSkeleton';
import { useAuth } from '@/lib/auth/context';
import { useAccount } from '@/lib/account/useAccount';

export default function AccountProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const {
    user,
    isLoading,
    error,
    updateProfile,
    changePassword,
    deleteAccount,
    logout,
  } = useAccount({
    loadUser: true,
    loadOrders: false,
    loadAddresses: false,
  });

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFirstname(user.firstname);
      setLastname(user.lastname);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setSaving(true);
      try {
        await updateProfile({ firstname, lastname, email });
        setMessage('Profile updated successfully.');
      } catch (err) {
        setMessage(
          err instanceof Error ? err.message : 'Failed to update profile'
        );
      } finally {
        setSaving(false);
      }
    },
    [updateProfile, firstname, lastname, email]
  );

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      await refreshSession();
      router.replace('/login');
    } finally {
      setLogoutLoading(false);
    }
  }, [logout, refreshSession, router]);

  const handlePasswordSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPasswordMessage(null);

      if (newPassword.length < 6) {
        setPasswordMessage('New password must be at least 6 characters.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordMessage('New password and confirmation do not match.');
        return;
      }

      setPasswordSaving(true);
      try {
        await changePassword({ currentPassword, newPassword });
        setPasswordMessage('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordForm(false), 1500);
      } catch (err) {
        setPasswordMessage(
          err instanceof Error ? err.message : 'Failed to change password'
        );
      } finally {
        setPasswordSaving(false);
      }
    },
    [changePassword, currentPassword, newPassword, confirmPassword]
  );

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount();
      await refreshSession();
      router.replace('/');
    } catch (_err) {
      setDeleteLoading(false);
      // Keep modal open to show error if needed, but currently we just let it go
    }
  }, [deleteAccount, deleteConfirmText, refreshSession, router]);

  if (authLoading || isLoading) {
    return <AccountSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">Redirecting to sign in...</p>
      </main>
    );
  }

  return (
    <AccountScaffold
      title="Profile"
      description="Update your account details."
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {(error || message) && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
          }`}
        >
          {error ?? message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-ink">First Name</span>
            <input
              value={firstname}
              onChange={event => setFirstname(event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink">Last Name</span>
            <input
              value={lastname}
              onChange={event => setLastname(event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 border-t border-border pt-6">
        <h3 className="mb-3 text-base font-semibold text-ink">Security</h3>
        {!showPasswordForm ? (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-accent"
          >
            Change password
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMessage && (
              <p
                role="status"
                className={`rounded-lg px-3 py-2 text-sm ${
                  passwordMessage.includes('successfully')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {passwordMessage}
              </p>
            )}
            <label className="block text-sm">
              <span className="mb-1 block text-ink">Current password</span>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink">New password</span>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink">Confirm new password</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {passwordSaving ? 'Updating...' : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordMessage(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h3 className="mb-3 text-base font-semibold text-red-600">
          Danger zone
        </h3>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          Delete account
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <h4 className="mb-2 text-lg font-semibold text-ink">
              Delete your account?
            </h4>
            <p className="mb-4 text-sm text-ink-muted">
              This action cannot be undone. All your data including orders and
              addresses will be permanently removed.
            </p>
            <label className="mb-4 block text-sm">
              <span className="mb-1 block text-ink">
                Type <strong>DELETE</strong> to confirm
              </span>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={event => setDeleteConfirmText(event.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-red-500 focus:outline-none"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                onClick={handleDeleteAccount}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountScaffold>
  );
}
