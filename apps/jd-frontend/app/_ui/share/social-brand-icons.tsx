/* eslint-disable no-restricted-syntax */
/**
 * 彩色品牌 SVG 图标组件，用于分享菜单。
 * 基于各平台官方品牌规范，简化适配 24×24 视口。
 */

import type { ShareChannel } from './types';

interface IconProps {
  className?: string;
}

export function FacebookBrandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M16.5 8.25h-1.75a.75.75 0 0 0-.75.75V11h2.5l-.5 2.5H14v6h-2.5v-6H9.5V11H11V9a2.5 2.5 0 0 1 2.5-2.5H16.5V8.25Z"
        fill="#fff"
      />
    </svg>
  );
}

export function XBrandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#000" />
      {/* X (Twitter) 官方 logo，缩小居中留边距 */}
      <g transform="translate(12, 12) scale(0.72) translate(-12, -12)">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="#fff"
        />
      </g>
    </svg>
  );
}

export function PinterestBrandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#BD081C" />
      <path
        d="M12 5a7 7 0 0 0-2.8 13.42c-.06-.52-.12-1.32.02-1.89.13-.53.83-3.28.83-3.28a2.34 2.34 0 0 1-.2-1.04c0-.97.57-1.7 1.27-1.7.6 0 .89.45.89 1 0 .6-.38 1.5-.58 2.34-.17.7.35 1.27 1.03 1.27 1.24 0 2.19-1.31 2.19-3.21 0-1.68-1.2-2.85-2.92-2.85-1.99 0-3.15 1.49-3.15 3.03 0 .6.23 1.24.51 1.59a.2.2 0 0 1 .05.19l-.19.77c-.03.12-.1.15-.22.09-.82-.38-1.34-1.6-1.34-2.57 0-2.09 1.52-4 4.38-4 2.3 0 4.09 1.64 4.09 3.84 0 2.29-1.44 4.13-3.45 4.13-.67 0-1.31-.35-1.53-.76l-.42 1.59c-.15.57-.55 1.28-.82 1.72A7 7 0 1 0 12 5Z"
        fill="#fff"
      />
    </svg>
  );
}

export function InstagramBrandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="5%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5948" />
          <stop offset="60%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
    </svg>
  );
}

export function EmailBrandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#EA4335" />
      <path
        d="M5.5 8.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7Z"
        fill="#fff"
      />
      <path
        d="M5.5 8.5 12 13l6.5-4.5"
        fill="none"
        stroke="#EA4335"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 8.5 12 13l6.5-4.5"
        fill="none"
        stroke="#C5221F"
        strokeWidth="0.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const BRAND_ICONS: Record<ShareChannel, React.ComponentType<IconProps>> = {
  facebook: FacebookBrandIcon,
  x: XBrandIcon,
  pinterest: PinterestBrandIcon,
  instagram: InstagramBrandIcon,
  email: EmailBrandIcon,
  sms: EmailBrandIcon,
  whatsapp: EmailBrandIcon,
};

export function getBrandIcon(
  channel: ShareChannel
): React.ComponentType<IconProps> {
  return BRAND_ICONS[channel];
}
