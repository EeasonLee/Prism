/**
 * Share module types for normalized share targets and channel unions.
 */

export interface ShareTarget {
  type: 'product' | 'article' | 'recipe' | 'category' | 'page';
  title: string;
  url: string;
  text?: string;
  imageUrl?: string;
  meta?: { id?: string; sku?: string; slug?: string };
}

/** 静态目标或点击时再解析（避免依赖 window 的首屏延迟） */
export type ShareTargetResolver = ShareTarget | (() => ShareTarget);

export type ShareChannel =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'facebook'
  | 'x'
  | 'pinterest'
  | 'instagram';

export interface ShareActionState {
  copied: boolean;
  nativeShareSupported: boolean;
  isTouchDevice: boolean;
}

export interface ShareActionHandlers {
  copyLink: () => Promise<boolean>;
  shareNatively: () => Promise<boolean>;
  openChannel: (channel: ShareChannel) => void;
}
