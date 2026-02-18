export type PaymentAccountType = 'BANK' | 'VIRTUAL_WALLET' | 'CRYPTO' | 'OTHER';

export const PAYMENT_ACCOUNT_TYPE_LABELS: Record<PaymentAccountType, string> = {
  BANK: 'Cuenta bancaria',
  VIRTUAL_WALLET: 'Billetera virtual',
  CRYPTO: 'Wallet crypto',
  OTHER: 'Otra',
};

export interface PaymentAccount {
  id: string;
  userId: string;
  name: string;
  holder: string;
  description: string | null;
  alias: string | null;
  type: PaymentAccountType;
  createdAt: string;
  updatedAt: string;
  organizations?: Array<{
    organization: { id: string; name: string };
  }>;
}

export interface CreatePaymentAccountData {
  name: string;
  holder: string;
  type: PaymentAccountType;
  description?: string;
  alias?: string;
}

export interface UpdatePaymentAccountData {
  name?: string;
  holder?: string;
  type?: PaymentAccountType;
  description?: string;
  alias?: string;
}
