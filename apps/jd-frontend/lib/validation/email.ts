/** 轻量邮箱校验，用于 UGC 提交（非 RFC 完整校验） */
const REASONABLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isReasonableEmail(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && t.length <= 254 && REASONABLE_EMAIL.test(t);
}

/** 游客未填姓名时：用邮箱 @ 前一段作为前台展示名（Strapi author_name 仍必填） */
export function guestAuthorLabelFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  const local = at > 0 ? trimmed.slice(0, at) : '';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]+/g, ' ').trim();
  const collapsed = cleaned.replace(/\s+/g, ' ');
  const slice = collapsed.slice(0, 100).trim();
  return slice.length > 0 ? slice : 'Customer';
}
