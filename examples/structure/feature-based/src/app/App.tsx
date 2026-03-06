import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Dashboard } from '@/features/dashboard/components/Dashboard';

/**
 * App shell -- handles routing between authenticated and unauthenticated views.
 *
 * Import rules enforced by this structure:
 * - Features import from @/shared/* for cross-cutting concerns
 * - Features NEVER import from other features directly
 * - The app shell is the only place that composes features together
 * - Shared code must be used by 3+ features before being extracted
 */
export function App() {
  const { user, checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!user) {
    return <LoginForm />;
  }

  return <Dashboard />;
}
