/**
 * Normalized share target containing essential metadata for sharing.
 * Used as input to channel-specific share URL builders.
 */
export interface ShareTarget {
  /** The URL to share */
  url: string;
  /** The title/headline for the shared content */
  title: string;
  /** The description or body text for the shared content */
  description: string;
}

/**
 * Supported share channels for phase 1.
 */
export type ShareChannel = 'email' | 'facebook';
