export interface Wallet {
  id: number;
  phoneNumber: string;
  email: string;
  code: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface WalletPage {
  content: Wallet[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Transaction {
  id: number;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_SEND' | 'TRANSFER_RECEIVE' | 'PAYMENT';
  amount: number;
  fees: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  createdAt: string;
}

export interface Facture {
  id: number;
  reference: string;
  walletCode: string;
  serviceName: string;
  unite: string;
  montant: number;
  payee: boolean;
  dateFacture: string;
  mois: string;
}

export interface BalanceResponse {
  phone: string;
  balance: number;
  currency: string;
}

export interface WalletStats {
  phoneNumber: string;
  code: string;
  balance: number;
  currency: string;
  totalTransactions: number;
  totalDepose: number;
  totalRetire: number;
  totalTransfere: number;
  totalPaye: number;
}
