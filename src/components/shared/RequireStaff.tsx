import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2Icon, LockIcon } from 'lucide-react';
import type { StaffRole } from '../../types/staff';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { roleHome, roleLabels } from '../../utils/staffAuth';
import { EmptyState } from './EmptyState';

interface RequireStaffProps {
  roles: StaffRole[];
  children: React.ReactNode;
}

/** Route guard: only signed-in staff with one of `roles` can see `children`. */
export function RequireStaff({ roles, children }: RequireStaffProps) {
  const { user, loading, logout } = useStaffAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-cream">
        <div role="status" className="flex items-center gap-3 text-muted">
          <Loader2Icon className="animate-spin" size={22} /> Checking sign-in…
        </div>
      </main>);

  }

  if (!user) {
    return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.role)) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-cream p-6">
        <EmptyState
          icon={LockIcon}
          title="You don't have access to this page"
          body={`Your ${roleLabels[user.role]} account can't open this area.`}
          action={
          <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to={roleHome(user.role)} className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-brand-ink">
                Go to my area
              </Link>
              <button type="button" onClick={() => void logout()} className="inline-flex h-12 items-center rounded-full px-6 font-semibold ring-1 ring-line hover:bg-surface">
                Sign out
              </button>
            </div>
          } />
        
      </main>);

  }

  return <>{children}</>;
}
