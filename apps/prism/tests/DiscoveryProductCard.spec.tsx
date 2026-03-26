import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiscoveryProductCard } from '../app/shop/components/DiscoveryProductCard';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src?: string;
    alt?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock replaces next/image
    <img src={src ?? ''} alt={alt ?? ''} className={className} />
  ),
}));

describe('DiscoveryProductCard', () => {
  it('renders without crashing when price is missing', () => {
    render(
      <DiscoveryProductCard
        item={{
          sku: 'SSO-TEST-CONFIG',
          name: 'JoyDeem Smart Air Fryer Pro 5.5L',
          subtitle: 'Crispy. Healthy. Effortless.',
          thumbnail:
            'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/pages/20250530164525_7fdcf392c6.png',
          price: null as never,
          in_stock: true,
          href: '/products/SSO-TEST-CONFIG',
        }}
      />
    );

    expect(
      screen.getByRole('link', { name: /JoyDeem Smart Air Fryer Pro 5.5L/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Price unavailable')).toBeInTheDocument();
  });
});
