import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { CardDescription, CardHeader, CardContent } from '../components/Card';
import { Wallet } from '../components/Icons';
import { Button } from '../components/Button';

export function Profile() {
  const { profile, loading, error, refreshProfile } = useProfile();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading profile: {error.message}</div>;
  }

  return (
    <div>
      <CardHeader>
        <CardDescription>View your current balance and transaction history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Available Balance</p>
              <h3 className="text-4xl font-black text-slate-900">{profile?.balance?.toLocaleString() || '0'} <span className="text-xl font-medium text-slate-500">VND</span></h3>
            </div>
          </div>
          <Button size="lg" className="rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
            Refresh
          </Button>
        </div>
      </CardContent>
    </div>
  );
}