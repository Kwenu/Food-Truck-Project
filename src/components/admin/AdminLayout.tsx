import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3Icon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MonitorIcon,
  QrCodeIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UtensilsCrossedIcon,
  WifiOffIcon } from
'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useNewOrderChime } from '../../hooks/useNewOrderChime';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import type { StaffRole } from '../../types/staff';
import { roleLabels } from '../../utils/staffAuth';
import { Logo } from '../shared/Logo';
import { Switch } from '../shared/Switch';

const nav: {to: string;label: string;icon: typeof LayoutDashboardIcon;end: boolean;roles: StaffRole[];}[] = [
{ to: '/admin', label: 'Overview', icon: LayoutDashboardIcon, end: true, roles: ['admin', 'manager'] },
{ to: '/admin/orders', label: 'Orders', icon: ReceiptTextIcon, end: false, roles: ['admin', 'manager'] },
{ to: '/admin/menu', label: 'Menu', icon: UtensilsCrossedIcon, end: false, roles: ['admin', 'manager'] },
{ to: '/admin/tables', label: 'Tables & QR', icon: QrCodeIcon, end: false, roles: ['admin', 'manager'] },
{ to: '/admin/reports', label: 'Reports', icon: BarChart3Icon, end: false, roles: ['admin', 'manager'] },
{ to: '/admin/staff', label: 'Staff access', icon: ShieldCheckIcon, end: false, roles: ['admin'] },
{ to: '/admin/settings', label: 'Settings', icon: SettingsIcon, end: false, roles: ['admin'] }];


export function AdminLayout() {
  const { orders, ordersReady, settings, updateSettings, connection } = useStore();
  const { user, logout } = useStaffAuth();
  const items = nav.filter((n) => user && n.roles.includes(user.role));
  useNewOrderChime(orders, settings.chimeEnabled, ordersReady, 'received');
  const pending = orders.filter((o) => o.status === 'received').length;

  return (
    <div className="min-h-screen w-full bg-cream lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-ink p-4 text-white lg:flex">
        <Link to="/admin" className="px-2 py-2">
          <Logo size="sm" tone="light" />
        </Link>
        <p className="px-2 text-xs font-semibold text-white/50">Back office</p>
        <nav aria-label="Admin" className="mt-6 flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) =>
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
            `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 ${
            isActive ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'}`

            }>
            
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {label === 'Orders' && pending > 0 &&
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-brand-ink">{pending}</span>
            }
            </NavLink>
          )}
          <div className="my-3 border-t border-white/10" />
          <Link to="/kitchen" className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white">
            <MonitorIcon size={18} /> Kitchen display
          </Link>
          <Link to="/" className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white">
            <ExternalLinkIcon size={18} /> Customer app
          </Link>
        </nav>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{settings.isOpen ? 'Truck is open' : 'Truck is closed'}</p>
              <p className="text-xs text-white/50">{settings.isOpen ? 'Accepting orders' : 'Ordering paused'}</p>
            </div>
            <Switch checked={settings.isOpen} onChange={(v) => updateSettings({ isOpen: v })} label="Accepting orders" />
          </div>
        </div>
        {user &&
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/5 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-white/50">{roleLabels[user.role]}</p>
            </div>
            <button type="button" onClick={() => void logout()} aria-label="Sign out" title="Sign out" className="grid h-9 w-9 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
              <LogOutIcon size={18} />
            </button>
          </div>
        }
      </aside>

      <div className="sticky top-0 z-30 bg-ink text-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo size="sm" tone="light" />
          <div className="flex items-center gap-2 text-xs font-semibold">
            {settings.isOpen ? 'Open' : 'Closed'}
            <Switch checked={settings.isOpen} onChange={(v) => updateSettings({ isOpen: v })} label="Accepting orders" />
            <button type="button" onClick={() => void logout()} aria-label="Sign out" className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10">
              <LogOutIcon size={16} />
            </button>
          </div>
        </div>
        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3">
          {items.map(({ to, label, end }) =>
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
            `flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ${isActive ? 'bg-white text-ink' : 'text-white/70'}`
            }>
            
              {label}
              {label === 'Orders' && pending > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-brand-ink">{pending}</span>}
            </NavLink>
          )}
          <Link to="/kitchen" className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-white/70">
            Kitchen
          </Link>
        </nav>
      </div>

      <main className="min-w-0">
        {connection === 'offline' &&
        <div role="alert" className="flex items-center gap-2 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger md:px-8">
            <WifiOffIcon size={16} /> Connection lost — reconnecting. New orders may be delayed.
          </div>
        }
        <Outlet />
      </main>
    </div>);

}