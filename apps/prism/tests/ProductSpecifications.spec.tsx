import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductSpecifications } from '../app/products/[slug]/ProductSpecifications';

describe('ProductSpecifications', () => {
  it('renders grouped specification rows', () => {
    render(
      <ProductSpecifications
        groups={[
          {
            id: 'general',
            title: 'General',
            rows: [
              { key: 'capacity', label: 'Capacity', value: '5.5L' },
              {
                key: 'power',
                label: 'Power',
                value: '1700W',
                highlighted: true,
              },
            ],
          },
          {
            id: 'dimensions',
            title: 'Dimensions',
            rows: [{ key: 'width', label: 'Width', value: '31 cm' }],
          },
        ]}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Specifications' })
    ).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Capacity')).toBeInTheDocument();
    expect(screen.getByText('5.5L')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('1700W')).toBeInTheDocument();
    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByText('31 cm')).toBeInTheDocument();
  });

  it('renders nothing when groups are empty', () => {
    const { container } = render(<ProductSpecifications groups={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
