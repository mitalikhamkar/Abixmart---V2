import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import AdminSidebar from '@/admin/components/AdminSidebar';
import '@/admin/admin.css';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="adm-shell">
      {/* Desktop persistent sidebar */}
      <aside className="adm-aside">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="adm-overlay"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="adm-drawer"
            >
              <AdminSidebar
                showCloseButton
                onClose={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="adm-body">
        <header className="adm-mobilebar">
          <button onClick={() => setMobileOpen(true)} className="adm-iconbtn adm-iconbtn--bare" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="adm-label adm-label--gold">ABIXMART Admin</span>
          <span style={{ width: '2.25rem' }} />
        </header>

        <main className="adm-main">
          <div className="adm-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}