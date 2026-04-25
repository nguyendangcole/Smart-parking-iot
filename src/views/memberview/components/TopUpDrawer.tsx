import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PlusCircle,
  Check,
  AlertCircle,
  Tag,
  Gift,
  ArrowRight,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';
import type { Profile } from '../../../shared/hooks/useProfile';
import { loadWallets, type LinkedWallet } from '../../../shared/utils/linkedWallets';

interface TopUpDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  refreshProfile?: () => Promise<void> | void;
  // Optional: called when the user taps "Go to Payments" in the empty wallet state.
  onNavigateToPayments?: () => void;
}

const MIN_TOPUP = 10_000;
const MAX_TOPUP = 5_000_000;

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

interface PromoCode {
  code: string;
  description: string;
  compute: (amount: number) => number;
}

// Promo codes are stored in code (YAGNI - no new table needed for a demo).
// Each `compute` receives the paid amount and returns the bonus balance in
// VND that should be credited on top of what the user paid.
const PROMO_CODES: PromoCode[] = [
  {
    code: 'FIRST10',
    description: '+10% bonus (up to 50,000 VND)',
    compute: amount => Math.min(50_000, Math.round(amount * 0.10)),
  },
  {
    code: 'WELCOME50',
    description: 'Flat 50,000 VND bonus',
    compute: () => 50_000,
  },
  {
    code: 'STUDENT5',
    description: '+5% bonus for students',
    compute: amount => Math.round(amount * 0.05),
  },
];

const formatVnd = (n: number) => n.toLocaleString('en-US');

// Parse a user-entered amount string. Strips any non-digit so thousand
// separators entered on some keyboards (e.g. "50,000" or "50.000") still
// resolve to a clean integer.
const parseAmount = (s: string): number => {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d]/g, '');
  if (!cleaned) return 0;
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
};

export default function TopUpDrawer({
  open,
  onClose,
  profile,
  refreshProfile,
  onNavigateToPayments,
}: TopUpDrawerProps) {
  const [amountInput, setAmountInput] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Toast state is managed inside this component and rendered as a sibling
  // of the drawer panel so it can persist after the panel closes. The parent
  // always mounts <TopUpDrawer/>, so toast state survives a close.
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Body scroll lock + ESC handler. Mirrors SubscriptionDrawer so both
  // drawers feel identical to the user.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, processing]);

  // Reset form state every time the drawer opens so a fresh session
  // doesn't show stale promo/error UI from a previous attempt.
  useEffect(() => {
    if (!open) return;
    setAmountInput('');
    setShowPromoInput(false);
    setPromoCode('');
    setAppliedPromo(null);
    setPromoError(null);
  }, [open]);

  // Refresh wallets on open so a wallet linked in another tab shows up
  // immediately. Selection defaults to the wallet flagged `isDefault`.
  useEffect(() => {
    if (!open || !profile?.id) return;
    const list = loadWallets(profile.id);
    setWallets(list);
    setSelectedWalletId(prev => {
      if (prev && list.some(w => w.id === prev)) return prev;
      const def = list.find(w => w.isDefault) || list[0];
      return def ? def.id : null;
    });
  }, [open, profile?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);
  const amountValid = amount >= MIN_TOPUP && amount <= MAX_TOPUP;
  const bonusAmount = appliedPromo && amountValid ? appliedPromo.compute(amount) : 0;
  const totalCredited = amount + bonusAmount;
  const currentBalance = Number(profile?.balance) || 0;
  const newBalance = currentBalance + totalCredited;

  const amountError = !amountInput
    ? null
    : amount < MIN_TOPUP
    ? `Minimum top-up is ${formatVnd(MIN_TOPUP)} VND.`
    : amount > MAX_TOPUP
    ? `Maximum top-up per transaction is ${formatVnd(MAX_TOPUP)} VND.`
    : null;

  const selectedWallet = wallets.find(w => w.id === selectedWalletId) || null;
  const canSubmit = amountValid && !!selectedWallet && !!profile?.id && !processing;

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) {
      setAmountInput('');
      return;
    }
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n)) return;
    setAmountInput(n.toLocaleString('en-US'));
  };

  const handlePresetClick = (preset: number) => {
    setAmountInput(preset.toLocaleString('en-US'));
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Enter a promo code.');
      return;
    }
    const match = PROMO_CODES.find(p => p.code === code);
    if (!match) {
      setAppliedPromo(null);
      setPromoError('Invalid or expired promo code.');
      return;
    }
    if (!amountValid) {
      setAppliedPromo(null);
      setPromoError('Enter a valid amount before applying a promo.');
      return;
    }
    setAppliedPromo(match);
    setPromoError(null);
    setPromoCode(code);
  };

  const handleClearPromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError(null);
    setShowPromoInput(false);
  };

  const handleConfirm = async () => {
    if (!canSubmit || !profile?.id || !selectedWallet) return;
    setProcessing(true);

    // Human-readable label for the admin ledger / receipts.
    const paymentMethod = selectedWallet.type === 'momo' ? 'MoMo' : 'ZaloPay';

    try {
      // Single atomic server-side call. `member_topup_balance` (see
      // sql_scripts/05_member_wallet.sql) inserts the TOP_UP row,
      // credits `profiles.balance`, and returns the new balance in
      // one transaction — no partial state if one step fails, and
      // no race with a concurrent end-session deduction.
      const { data, error } = await supabase.rpc('member_topup_balance', {
        p_amount: amount,
        p_bonus_amount: bonusAmount,
        p_payment_method: paymentMethod,
        p_promo_code: appliedPromo?.code ?? null,
      });

      if (error) throw new Error(error.message);

      // PostgREST returns RETURNS TABLE as an array; surface the first
      // row so downstream code can show the authoritative new balance.
      const row = Array.isArray(data) ? data[0] : data;
      const serverTotal = Number(row?.total_credited) || totalCredited;
      const serverBonus = Number(row?.bonus_credited) || bonusAmount;
      const serverPaid = Number(row?.amount_paid) || amount;

      if (refreshProfile) await refreshProfile();

      setToast({
        title: 'Top-up Successful!',
        message:
          serverBonus > 0
            ? `Added ${formatVnd(serverTotal)} VND (incl. ${formatVnd(serverBonus)} bonus) via ${paymentMethod}.`
            : `Added ${formatVnd(serverPaid)} VND via ${paymentMethod}.`,
        type: 'success',
      });

      onClose();
    } catch (err: any) {
      setToast({
        title: 'Top-up Failed',
        message: err?.message || 'Unexpected error. Please try again.',
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="topup-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !processing && onClose()}
              aria-hidden="true"
            />
            <motion.aside
              key="topup-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] bg-slate-50 shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="topup-drawer-title"
            >
              <header className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wallet</p>
                    <h2 id="topup-drawer-title" className="text-base font-bold text-slate-800">
                      Top Up Balance
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => !processing && onClose()}
                  aria-label="Close panel"
                  disabled={processing}
                  className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="px-6 pt-6 pb-2 shrink-0">
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white px-5 py-4 shadow-md shadow-primary/15"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest">
                        Current Balance
                      </p>
                      <p className="text-2xl font-black tracking-tight tabular-nums">
                        {formatVnd(currentBalance)}{' '}
                        <span className="text-sm font-bold text-blue-100/80">VND</span>
                      </p>
                    </div>
                    {totalCredited > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
                          <TrendingUp size={10} />
                          After Top-up
                        </p>
                        <p className="text-lg font-extrabold tabular-nums">
                          {formatVnd(newBalance)}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.section>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 flex flex-col gap-5">
                {/* Amount */}
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Top-up Amount
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Min {formatVnd(MIN_TOPUP)} · Max {formatVnd(MAX_TOPUP)} VND
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map(preset => {
                      const isActive = amount === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handlePresetClick(preset)}
                          disabled={processing}
                          className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            isActive
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {preset >= 1_000_000 ? `${preset / 1_000_000}M` : `${preset / 1_000}k`}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Or enter a custom amount"
                      value={amountInput}
                      onChange={e => handleAmountChange(e.target.value)}
                      disabled={processing}
                      className={`w-full h-12 pl-4 pr-14 rounded-xl border-2 font-bold tabular-nums text-slate-800 bg-white transition-colors focus:outline-none ${
                        amountError
                          ? 'border-red-300 focus:border-red-500'
                          : amountValid
                          ? 'border-primary/50 focus:border-primary'
                          : 'border-slate-200 focus:border-primary'
                      } disabled:opacity-50`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                      VND
                    </span>
                  </div>
                  {amountError && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {amountError}
                    </p>
                  )}
                </motion.section>

                {/* Promo code */}
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
                >
                  {appliedPromo ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Tag size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-700 truncate">
                            {appliedPromo.code} applied
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {appliedPromo.description} · +{formatVnd(bonusAmount)} VND
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearPromo}
                        disabled={processing}
                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : !showPromoInput ? (
                    <button
                      type="button"
                      onClick={() => setShowPromoInput(true)}
                      disabled={processing}
                      className="flex items-center justify-between gap-2 text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Gift size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Have a promo code?</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Unlock bonus balance
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                      />
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Gift size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Promo Code</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={e => {
                            setPromoCode(e.target.value.toUpperCase());
                            if (promoError) setPromoError(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyPromo();
                            }
                          }}
                          disabled={processing}
                          className="flex-1 h-10 px-3 rounded-lg border-2 border-slate-200 focus:border-primary focus:outline-none text-sm font-bold uppercase tracking-wider text-slate-800 bg-white disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={processing || !promoCode.trim()}
                          className="px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                          <AlertCircle size={12} />
                          {promoError}
                        </p>
                      )}
                    </>
                  )}
                </motion.section>

                {/* Payment method */}
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Payment Method
                  </p>
                  {wallets.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <CreditCard className="text-slate-300" size={32} />
                      <p className="text-sm font-bold text-slate-700">No wallets linked</p>
                      <p className="text-[11px] text-slate-400 font-medium max-w-[260px]">
                        Link a MoMo or ZaloPay wallet from the Payments tab before topping up.
                      </p>
                      {onNavigateToPayments && (
                        <button
                          type="button"
                          onClick={onNavigateToPayments}
                          className="mt-1 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Go to Payments
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    wallets.map(w => {
                      const isSelected = selectedWalletId === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWalletId(w.id)}
                          disabled={processing}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[10px] ${
                              w.type === 'momo'
                                ? 'bg-pink-600 shadow-md shadow-pink-500/30'
                                : 'bg-sky-500 shadow-md shadow-sky-400/30'
                            }`}
                          >
                            {w.type === 'momo' ? 'MoMo' : 'ZP'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-bold truncate ${
                                  isSelected ? 'text-primary' : 'text-slate-800'
                                }`}
                              >
                                {w.label}
                              </p>
                              {w.isDefault && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-tighter rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                              isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </motion.section>

                {/* Summary */}
                <AnimatePresence>
                  {amountValid && (
                    <motion.section
                      key="topup-summary"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-bold text-slate-700 tabular-nums">
                          {formatVnd(amount)} VND
                        </span>
                      </div>
                      {bonusAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Bonus ({appliedPromo?.code})</span>
                          <span className="font-bold text-emerald-600 tabular-nums">
                            + {formatVnd(bonusAmount)} VND
                          </span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-2 flex justify-between">
                        <span className="font-bold text-slate-800">Total Credited</span>
                        <span className="text-lg font-black text-primary tabular-nums">
                          {formatVnd(totalCredited)} VND
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Balance after</span>
                        <span className="font-bold text-slate-600 tabular-nums">
                          {formatVnd(newBalance)} VND
                        </span>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>

              <footer className="border-t border-slate-200 bg-white px-6 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => !processing && onClose()}
                  disabled={processing}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canSubmit}
                  aria-label={
                    amountValid
                      ? `Top up ${formatVnd(totalCredited)} VND`
                      : 'Top up (enter amount)'
                  }
                  className={`flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    processing
                      ? 'bg-primary/70 cursor-wait'
                      : 'bg-primary hover:bg-primary-dark active:scale-[0.98] shadow-md shadow-primary/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      {amountValid ? `Top Up ${formatVnd(totalCredited)} VND` : 'Top Up'}
                    </>
                  )}
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Toast lives outside the drawer panel's AnimatePresence so it
          survives the panel closing. The component is always mounted by
          the parent, so setToast state persists across open/close. */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="topup-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[60] bg-white rounded-2xl shadow-2xl border p-4 flex items-center gap-3 max-w-sm ${
              toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'
            }`}
            role="status"
            aria-live="polite"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm">{toast.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
