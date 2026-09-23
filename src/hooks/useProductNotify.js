import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { checkNotifySubscribed, subscribeToNotify } from '@/lib/notifyUtils';

// status: 'idle' | 'checking' | 'not-subscribed' | 'already-subscribed'
//       | 'subscribed' (just subscribed this session) | 'submitting' | 'error'
export function useProductNotify(productId, productName) {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const check = useCallback(async () => {
    if (!user) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    try {
      const exists = await checkNotifySubscribed(user.uid, productId);
      setStatus(exists ? 'already-subscribed' : 'not-subscribed');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Notify check failed:', err?.code, err?.message);
      setStatus('error');
      setError('Could not check subscription status.');
    }
  }, [user, productId]);

  useEffect(() => {
    check();
  }, [check]);

  const subscribe = useCallback(async () => {
    if (!user) return false;
    setStatus('submitting');
    setError('');
    try {
      await subscribeToNotify(user.uid, user.email, productId, productName);
      setStatus('subscribed');
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Notify subscribe failed:', err?.code, err?.message);
      setStatus('error');
      setError("Could not save your request. Please try again.");
      return false;
    }
  }, [user, productId, productName]);

  return { status, error, subscribe, isLoggedIn: Boolean(user) };
}