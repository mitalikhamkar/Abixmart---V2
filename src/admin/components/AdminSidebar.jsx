import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingBag, MessageSquare, BarChart3,
  Activity, Radar, TrendingUp, Users2, Settings as SettingsIcon, LogOut, X,
} from 'lucide-react';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';
import logo from '@/assets/logo/Abixmart-header.png';

const NAV_ITEMS = [
  { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: Package },
  { label: 'Products', path: '/admin/products', icon: ShoppingBag },
  { label: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Customer Activity', path: '/admin/customer-activity', icon: Activity },
  { label: 'Acquisition', path: '/admin/acquisition', icon: Radar },
  { label: 'Product Performance', path: '/admin/product-performance', icon: TrendingUp },
  { label: 'Community', path: '/admin/community', icon: Users2 },
  { label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

export default function AdminSidebar({ onNavigate, onClose, showCloseButton }) {
  const { adminData, user, logout } = useAdminAuth();

  return (
    <div className="flex h-full flex-col bg-charcoal text-ivory">
      <div className="flex items-center justify-between px-5 py-5 border-b border-ivory/10">
        <div className="inline-flex items-center gap-2 rounded-full bg-ivory/95 px-3 py-1.5">
          <img src={logo} alt="ABIXMART" className="h-4 w-auto object-contain" />
        </div>
        {showCloseButton && (
          <button onClick={onClose} className="text-ivory/50 hover:text-ivory p-1">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive ? 'bg-ivory/10 text-ivory' : 'text-ivory/55 hover:text-ivory hover:bg-ivory/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-ivory/10">
        <p className="text-xs text-ivory/40 truncate">{user?.email}</p>
        <p className="text-[10px] text-ivory/25 uppercase tracking-luxe-sm mt-0.5">{adminData?.role || 'admin'}</p>
        <button
          onClick={logout}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-xs uppercase tracking-luxe-sm text-ivory/60 hover:text-ivory border border-ivory/15 hover:border-ivory/30 rounded-md py-2.5 transition-colors"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </div>
  );
}