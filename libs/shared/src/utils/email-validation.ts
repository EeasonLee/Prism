const REASONABLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isReasonableEmail(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 254 &&
    REASONABLE_EMAIL.test(trimmed)
  );
}

export function labelFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  const local = at > 0 ? trimmed.slice(0, at) : '';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]+/g, ' ').trim();
  const collapsed = cleaned.replace(/\s+/g, ' ');
  const label = collapsed.slice(0, 100).trim();
  return label.length > 0 ? label : 'User';
}
