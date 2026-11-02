import React from "react";
import { BoxIcon } from "lucide-react";
interface EmptyStateProps {
  icon: BoxIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  tone?: 'light' | 'dark';
}
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = 'light'
}: EmptyStateProps) {
  return <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className={`grid h-14 w-14 place-items-center rounded-2xl ${tone === 'dark' ? 'bg-night-line text-night-muted' : 'bg-brand/10 text-brand-strong'}`}>
        <Icon size={26} />
      </span>
      <h3 className="mt-4 font-display text-xl font-extrabold uppercase tracking-tight">{title}</h3>
      {body && <p className={`mt-1.5 max-w-sm text-sm ${tone === 'dark' ? 'text-night-muted' : 'text-muted'}`}>{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>;
}