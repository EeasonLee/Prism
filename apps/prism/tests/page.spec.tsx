import { render, screen } from '@testing-library/react';
import Page from '../app/page';

describe('Home Page', () => {
  it('renders the hero title and CTAs', () => {
    render(<Page />);

    expect(
      screen.getByRole('heading', { level: 1, name: /hello next in prism/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看文档' })).toBeInTheDocument();
  });
});
