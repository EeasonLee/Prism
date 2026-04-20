'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountScaffold } from '../components/AccountScaffold';
import { useAuth } from '@/lib/auth/context';
import { useAccount } from '@/lib/account/useAccount';

export default function AccountProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const { user, isLoading, error, updateProfile, logout } = useAccount({
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

  if (authLoading || isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      </main>
    );
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
    </AccountScaffold>
  );
}
