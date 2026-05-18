'use client';

export type AuthTab = 'signin' | 'register';

interface AuthTabsProps {
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  labels?: {
    signin: string;
    register: string;
  };
}

export function AuthTabs({
  activeTab,
  onTabChange,
  labels = { signin: 'Sign in', register: 'Register' },
}: AuthTabsProps) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-surface p-1">
      <button
        type="button"
        onClick={() => onTabChange('signin')}
        className={`rounded-lg py-2 text-sm font-medium transition ${
          activeTab === 'signin'
            ? 'bg-background text-ink shadow-sm'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        {labels.signin}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('register')}
        className={`rounded-lg py-2 text-sm font-medium transition ${
          activeTab === 'register'
            ? 'bg-background text-ink shadow-sm'
            : 'text-ink-muted hover:text-ink'
        }`}
      >
        {labels.register}
      </button>
    </div>
  );
}
