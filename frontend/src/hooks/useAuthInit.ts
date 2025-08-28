import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export function useAuthInit() {
  const { checkAuthStatus, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return { isLoading };
}