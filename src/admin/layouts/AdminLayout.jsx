import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import AdminSidebar from '@/admin/components/AdminSidebar';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
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
              className="fixed inset-0 bg-charcoal/60 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 lg:hidden"
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

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 bg-charcoal text-ivory flex items-center justify-between px-4 py-3.5">
          <button onClick={() => setMobileOpen(true)} className="p-1">
            <Menu size={20} />
          </button>
          <span className="label-meta text-gold-light">ABIXMART Admin</span>
          <span className="w-5" />
        </header>

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}