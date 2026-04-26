// Shared constants for the member notification system.
//
// Centralising these values keeps the Settings copy ("Notify when
// balance is below 50,000 VND"), the Payments low-balance banner
// trigger, and the Dashboard notification dropdown injection in
// lock-step. Change the threshold once and every surface follows.

// Wallet balance below which a low-balance alert is surfaced to the
// member (assuming `profiles.notify_low_balance` is true). Stored as a
// plain VND number so callers can compare directly against
// `profiles.balance` without unit conversion.
export const LOW_BALANCE_THRESHOLD = 50000;

// Promotional notifications shown in the Dashboard bell dropdown when
// `profiles.notify_promotions` is true. Mock data lives here so the
// UI can render something concrete today; once a real CMS / promotions
// table exists, this array can be swapped for a Supabase query without
// touching the consuming components.
export interface PromotionalNotification {
  id: string;
  title: string;
  message: string;
  // Human-readable relative time. We keep this as a static string for
  // now since the promos are mock data; a real backend would emit
  // timestamps that the consumer formats with `toLocaleString`.
  time: string;
}

export const PROMOTIONAL_NOTIFICATIONS: PromotionalNotification[] = [
  {
    id: 'promo-weekend-discount',
    title: 'Weekend 20% Off',
    message: 'Park any weekend this month and get 20% off your session fee.',
    time: 'Today',
  },
  {
    id: 'promo-refer-friend',
    title: 'Refer a Friend',
    message: 'Invite a classmate and you both get 30,000 VND added to your wallet.',
    time: '2 days ago',
  },
];
