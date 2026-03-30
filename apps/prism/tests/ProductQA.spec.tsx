import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AuthUser } from '../lib/api/magento/types';
import { ProductQA } from '../app/products/[sku]/ProductQA';
import type {
  ProductQaListResult,
  ProductQuestion,
} from '../lib/api/strapi/product-qa';

const mocks = vi.hoisted(() => ({
  auth: {
    user: null as AuthUser | null,
    accessToken: null as string | null,
    isAuthenticated: false,
  },
  openLogin: vi.fn(),
}));

vi.mock('../lib/auth/context', () => ({
  useAuth: () => ({
    user: mocks.auth.user,
    accessToken: mocks.auth.accessToken,
    isAuthenticated: mocks.auth.isAuthenticated,
    isGuest: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../lib/auth-modal/context', () => ({
  useAuthModal: () => ({
    openLogin: mocks.openLogin,
    closeLogin: vi.fn(),
  }),
}));

const faqLikeItem: ProductQuestion = {
  id: 1,
  kind: 'faq',
  sku: 'JD-AF550',
  productSku: 'JD-AF550',
  authorName: 'Joydeem',
  questionText: 'How long does it last?',
  answerText: '<p>3-5 years</p>',
  answeredAt: '2026-01-15T10:00:00.000Z',
  answeredBy: 'Support',
  status: 'answered',
  helpfulCount: 0,
  viewerHasMarkedHelpful: false,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
};

const userQaItem: ProductQuestion = {
  id: 2,
  kind: 'user_qa',
  sku: 'JD-AF550',
  productSku: 'JD-AF550',
  authorName: 'Jane',
  questionText: 'Does it include a warranty?',
  answerText: '<p>2-year warranty</p>',
  answeredAt: '2026-02-21T09:00:00.000Z',
  answeredBy: null,
  status: 'answered',
  helpfulCount: 1,
  viewerHasMarkedHelpful: false,
  createdAt: '2026-02-20T14:30:00.000Z',
  updatedAt: '2026-02-21T09:00:00.000Z',
};

const baseResult: ProductQaListResult = {
  sku: 'JD-AF550',
  items: [faqLikeItem, userQaItem],
  pagination: { page: 1, pageSize: 10, pageCount: 1, total: 2 },
};

const signedInUser: AuthUser = {
  id: '42',
  email: 'buyer@example.com',
  username: 'buyer',
  first_name: 'Test',
  last_name: 'Buyer',
  email_verified: true,
  active: true,
  role: 'customer',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  last_login_at: null,
};

describe('ProductQA', () => {
  beforeEach(() => {
    mocks.auth.user = null;
    mocks.auth.accessToken = null;
    mocks.auth.isAuthenticated = false;
    mocks.openLogin.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders the section heading, list items, and ask-a-question card', () => {
    render(<ProductQA sku="JD-AF550" initialResult={baseResult} allowSubmit />);

    expect(
      screen.getByRole('heading', { name: /questions and answers/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/ask a question/i)).toBeInTheDocument();
    expect(screen.getByText('How long does it last?')).toBeInTheDocument();
    expect(screen.getByText('Does it include a warranty?')).toBeInTheDocument();
    expect(screen.getByText(/Official FAQ/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Q&A/i)).toBeInTheDocument();
  });

  it('opens sign-in when an unauthenticated user tries to submit a question', async () => {
    const user = userEvent.setup();

    render(<ProductQA sku="SKU-1" initialResult={baseResult} allowSubmit />);

    await user.click(screen.getByRole('button', { name: /submit question/i }));

    expect(mocks.openLogin).toHaveBeenCalledWith('signin');
  });

  it('submits a valid question and shows the success message', async () => {
    const user = userEvent.setup();

    mocks.auth.user = signedInUser;
    mocks.auth.accessToken = 'token-abc';
    mocks.auth.isAuthenticated = true;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'Thank you for your question.',
        questionId: 99,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ProductQA sku="JD-AF550" initialResult={baseResult} allowSubmit />);

    await user.type(
      screen.getByLabelText(/your question/i),
      'Does this fit a family of four? It is important for us.'
    );
    await user.click(screen.getByRole('button', { name: /submit question/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/thank you for your question/i)
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/product-qa/questions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
        }) as Record<string, string>,
      })
    );
  });

  it('loads another page when pagination changes', async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        sku: 'JD-AF550',
        items: [faqLikeItem],
        pagination: { page: 2, pageSize: 10, pageCount: 2, total: 11 },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const multiPage: ProductQaListResult = {
      ...baseResult,
      pagination: { page: 1, pageSize: 10, pageCount: 2, total: 11 },
    };

    render(<ProductQA sku="JD-AF550" initialResult={multiPage} allowSubmit />);

    await user.click(screen.getByRole('button', { name: /page 2/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/page=2/),
        expect.anything()
      );
    });
  });
});
