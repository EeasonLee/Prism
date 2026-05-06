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

export type ShareChannel =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'facebook'
  | 'x'
  | 'pinterest';

export interface ShareActionState {
  copied: boolean;
  nativeShareSupported: boolean;
}

export interface ShareActionHandlers {
  copyLink: () => Promise<boolean>;
  shareNatively: () => Promise<boolean>;
  openChannel: (channel: ShareChannel) => void;
}
