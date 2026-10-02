import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingBag, MessageSquare, BarChart3,
  Activity, Radar, TrendingUp, Users2, Settings as SettingsIcon, LogOut, X,
} from 'lucide-react';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';
import logo from '@/assets/logo/Abixmart-header.png';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
      { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Orders', path: '/admin/orders', icon: Package },
      { label: 'Products', path: '/admin/products', icon: ShoppingBag },
      { label: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { label: 'Customer Activity', path: '/admin/customer-activity', icon: Activity },
      { label: 'Acquisition', path: '/admin/acquisition', icon: Radar },
      { label: 'Product Performance', path: '/admin/product-performance', icon: TrendingUp },
      { label: 'Community', path: '/admin/community', icon: Users2 },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Settings', path: '/admin/settings', icon: SettingsIcon }],
  },
];

export default function AdminSidebar({ onNavigate, onClose, showCloseButton }) {
  const { adminData, user, logout } = useAdminAuth();

  return (
    <div className="adm-sidebar">
      <div className="adm-brand">
        <div>
          <div className="adm-brand-pill">
            <img src={logo} alt="ABIXMART" />
          </div>
          <span className="adm-brand-sub">Admin</span>
        </div>
        {showCloseButton && (
          <button onClick={onClose} className="adm-iconbtn adm-iconbtn--bare" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="adm-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="adm-nav-group">
            <p className="adm-nav-group-label">{group.label}</p>
            <div>
              {group.items.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onNavigate}
                  className={({ isActive }) => `adm-nav-link${isActive ? ' is-active' : ''}`}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="adm-sidebar-foot">
        <p className="adm-foot-email">{user?.email}</p>
        <p className="adm-foot-role">{adminData?.role || 'admin'}</p>
        <button onClick={logout} className="adm-btn adm-btn--block" style={{ marginTop: '0.9rem' }}>
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </div>
  );
}