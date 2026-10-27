import { create } from 'zustand';

interface BillingState {
  activeTab: 'packages' | 'transactions';
  walletBalance: number;
  setActiveTab: (tab: 'packages' | 'transactions') => void;
  setWalletBalance: (balance: number) => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  activeTab: 'packages',
  walletBalance: 0,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
}));
