// Linked payment wallets (MoMo, ZaloPay) used by the member portal for
// top-ups and plan renewals. Persisted to localStorage because there isn't
// a linked_wallets table yet. Keyed per-user so multiple members sharing a
// browser don't leak wallets across accounts.

export type WalletType = 'momo' | 'zalopay';

export interface LinkedWallet {
  id: string;
  type: WalletType;
  label: string;
  isDefault: boolean;
  linkedAt: string;
}

// Masked tail digits are stable mock values so the demo looks real
// without exposing PII. Seeded the first time any caller reads.
const DEFAULT_WALLETS: Omit<LinkedWallet, 'linkedAt'>[] = [
  { id: 'momo-default', type: 'momo', label: 'MoMo •• 2789', isDefault: true },
  { id: 'zalopay-default', type: 'zalopay', label: 'ZaloPay •• 4561', isDefault: false },
];

export const walletStorageKey = (uid: string) => `parking_wallets_${uid}`;

// Returns the user's linked wallets, seeding the defaults on first read so
// demo flows (top-up, plan renewal) have wallets available without first
// opening the Subscription drawer.
export function loadWallets(uid: string): LinkedWallet[] {
  try {
    const raw = localStorage.getItem(walletStorageKey(uid));
    if (!raw) {
      const seeded: LinkedWallet[] = DEFAULT_WALLETS.map(w => ({
        ...w,
        linkedAt: new Date().toISOString(),
      }));
      localStorage.setItem(walletStorageKey(uid), JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LinkedWallet[]) : [];
  } catch {
    return [];
  }
}

export function saveWallets(uid: string, wallets: LinkedWallet[]) {
  try {
    localStorage.setItem(walletStorageKey(uid), JSON.stringify(wallets));
  } catch {
    // Storage quota or private mode - non-fatal, in-memory state still works.
  }
}
