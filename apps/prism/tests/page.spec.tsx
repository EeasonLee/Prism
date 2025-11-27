import { describe, expect, it } from 'vitest';
import Page from '../app/page';

describe('Home Page', () => {
  it('renders the default greeting', () => {
    const rendered = Page();

    expect(rendered.props.children).toContain('Hello Next in prism');
  });
});
