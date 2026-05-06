import { randomUUID } from 'node:crypto';
import { magentoClient } from '@/infrastructure/api/clients/magento';
import type {
  AuthProviderGuestSessionResult,
  AuthProviderLoginResult,
} from './types';
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
  forgotPassword(input: { email: string; template: string }): Promise<boolean>;
  resetPassword(input: {
    email: string;
    resetToken: string;
    newPassword: string;
  }): Promise<boolean>;
}

export const magentoAuthProvider: MagentoAuthProvider = {
  async login(input) {
    const magentoAccessToken = await magentoClient.post<string>(
      'integration/customer/token',
      {
        body: {
          username: input.email,
          password: input.password,
        },
      }
    );

    const customer = await magentoClient.get<MagentoCustomerMeResponse>(
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
    await magentoClient.post<MagentoCustomerMeResponse>('customers', {
      body: {
        customer: {
          email: input.email,
          firstname: input.firstName ?? 'Customer',
          lastname: input.lastName ?? 'User',
        },
        password: input.password,
      },
    });

    return this.login(input);
  },
  async getCustomerProfile(magentoAccessToken) {
    const customer = await magentoClient.get<MagentoCustomerMeResponse>(
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
  async forgotPassword(input) {
    await magentoClient.put<boolean>('customers/password', {
      body: { email: input.email, template: input.template },
    });
    return true;
  },
  async resetPassword(input) {
    await magentoClient.post<boolean>('customers/resetPassword', {
      body: {
        email: input.email,
        resetToken: input.resetToken,
        newPassword: input.newPassword,
      },
    });
    return true;
  },
  async logout(magentoAccessToken) {
    await magentoClient.post<boolean>(
      'integration/customer/revoke-customer-token',
      {
        headers: {
          Authorization: `Bearer ${magentoAccessToken}`,
        },
      }
    );
  },
};
