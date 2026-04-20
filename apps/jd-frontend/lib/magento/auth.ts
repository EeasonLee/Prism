import { randomUUID } from 'node:crypto';
import { magentoRestFetch } from '@/lib/api/bff/magento-rest-client';
import type {
  AuthProviderGuestSessionResult,
  AuthProviderLoginResult,
} from '@/lib/auth/types';
interface MagentoCustomerMeResponse {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}

export interface MagentoAuthProvider {
  login(input: {
    email: string;
    password: string;
    guestId?: string;
  }): Promise<AuthProviderLoginResult>;
  register(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    guestId?: string;
  }): Promise<AuthProviderLoginResult>;
  getCustomerProfile(
    magentoAccessToken: string
  ): Promise<AuthProviderLoginResult['user']>;
  createGuestSession(): Promise<AuthProviderGuestSessionResult>;
  refreshCustomerSession(input: {
    refreshToken: string;
  }): Promise<AuthProviderLoginResult>;
  logout(magentoAccessToken: string): Promise<void>;
}

export const magentoAuthProvider: MagentoAuthProvider = {
  async login(input) {
    const magentoAccessToken = await magentoRestFetch<string>(
      'integration/customer/token',
      {
        method: 'POST',
        body: JSON.stringify({
          username: input.email,
          password: input.password,
        }),
      }
    );

    const customer = await magentoRestFetch<MagentoCustomerMeResponse>(
      'customers/me',
      {
        headers: {
          Authorization: `Bearer ${magentoAccessToken}`,
        },
      }
    );

    return {
      user: {
        id: String(customer.id),
        email: customer.email,
        firstName: customer.firstname,
        lastName: customer.lastname,
      },
      magentoAccessToken,
      guestId: input.guestId,
      cartMergeStatus: 'skipped',
    };
  },
  async register(input) {
    await magentoRestFetch<MagentoCustomerMeResponse>('customers', {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          email: input.email,
          firstname: input.firstName ?? 'Customer',
          lastname: input.lastName ?? 'User',
        },
        password: input.password,
      }),
    });

    return this.login(input);
  },
  async getCustomerProfile(magentoAccessToken) {
    const customer = await magentoRestFetch<MagentoCustomerMeResponse>(
      'customers/me',
      {
        headers: {
          Authorization: `Bearer ${magentoAccessToken}`,
        },
      }
    );

    return {
      id: String(customer.id),
      email: customer.email,
      firstName: customer.firstname,
      lastName: customer.lastname,
    };
  },
  async createGuestSession() {
    const guestId = randomUUID();
    return {
      guestId,
      // guest 在 REST guest-carts 链路中不依赖 customer token，
      // 使用本地占位符避免继续依赖旧 /api/auth/guest 网关。
      magentoAccessToken: `guest-local:${guestId}`,
    };
  },
  async refreshCustomerSession() {
    throw new Error(
      'magentoAuthProvider.refreshCustomerSession is not implemented'
    );
  },
  async logout(magentoAccessToken) {
    await magentoRestFetch<boolean>(
      'integration/customer/revoke-customer-token',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${magentoAccessToken}`,
        },
      }
    );
  },
};
