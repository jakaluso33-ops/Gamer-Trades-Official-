import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabase, Profile } from './supabase';
import {
  Portfolio,
  listPortfolios,
  createPortfolio as createPortfolioApi,
  renamePortfolio as renamePortfolioApi,
  deletePortfolio as deletePortfolioApi,
  setActivePortfolioId,
} from './trading';
import { registerPushToken } from './notifications';
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  /** All of this user's trading accounts, oldest first. */
  portfolios: Portfolio[];
  /** The account currently in use across Dashboard/Trade Desk/Portfolio. */
  activePortfolio: Portfolio | null;
  portfoliosLoading: boolean;
  switchPortfolio: (portfolioId: string) => Promise<void>;
  addPortfolio: (name: string, startingBalance?: number) => Promise<Portfolio>;
  renamePortfolio: (portfolioId: string, name: string) => Promise<void>;
  removePortfolio: (portfolioId: string) => Promise<void>;
  /** Patches a portfolio's balance in local state after a trade/deposit mutates it server-side, without a full refetch. */
  applyPortfolioPatch: (updated: Portfolio) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);

  const loadPortfolios = useCallback(async (userId: string, activeId: string | null) => {
    setPortfoliosLoading(true);
    try {
      const list = await listPortfolios(userId);
      setPortfolios(list);
      const active = list.find(p => p.id === activeId) ?? list[0] ?? null;
      setActivePortfolio(active);
      // If the profile's stored active id was missing/stale (deleted account, fresh signup), persist the fallback.
      if (active && active.id !== activeId) {
        setActivePortfolioId(userId, active.id).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPortfoliosLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data as Profile | null);
    if (data) {
      await loadPortfolios(userId, (data as Profile).active_portfolio_id);
      // Keeps an already-opted-in user's token fresh across reinstalls/token rotation.
      // No permission prompt — registerPushToken no-ops if permission isn't already granted.
      if ((data as Profile).notifications_enabled) registerPushToken(userId).catch(console.error);
    }
  }, [loadPortfolios]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setPortfolios([]);
        setActivePortfolio(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const switchPortfolio = useCallback(async (portfolioId: string) => {
    if (!session?.user) return;
    const target = portfolios.find(p => p.id === portfolioId);
    if (!target) return;
    setActivePortfolio(target);
    await setActivePortfolioId(session.user.id, portfolioId);
  }, [session, portfolios]);

  const addPortfolio = useCallback(async (name: string, startingBalance?: number) => {
    if (!session?.user) throw new Error('Not signed in');
    const created = await createPortfolioApi(session.user.id, name, startingBalance);
    setPortfolios(prev => [...prev, created]);
    setActivePortfolio(created);
    await setActivePortfolioId(session.user.id, created.id);
    return created;
  }, [session]);

  const renamePortfolio = useCallback(async (portfolioId: string, name: string) => {
    const updated = await renamePortfolioApi(portfolioId, name);
    setPortfolios(prev => prev.map(p => (p.id === portfolioId ? updated : p)));
    setActivePortfolio(prev => (prev?.id === portfolioId ? updated : prev));
  }, []);

  const removePortfolio = useCallback(async (portfolioId: string) => {
    if (!session?.user) return;
    await deletePortfolioApi(session.user.id, portfolioId);
    const next = portfolios.filter(p => p.id !== portfolioId);
    setPortfolios(next);
    if (activePortfolio?.id === portfolioId) {
      const fallback = next[0] ?? null;
      setActivePortfolio(fallback);
      if (fallback) await setActivePortfolioId(session.user.id, fallback.id);
    }
  }, [session, portfolios, activePortfolio]);

  const applyPortfolioPatch = useCallback((updated: Portfolio) => {
    setPortfolios(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    setActivePortfolio(prev => (prev?.id === updated.id ? updated : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        refreshProfile,
        signOut,
        portfolios,
        activePortfolio,
        portfoliosLoading,
        switchPortfolio,
        addPortfolio,
        renamePortfolio,
        removePortfolio,
        applyPortfolioPatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
