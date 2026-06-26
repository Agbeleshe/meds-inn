import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { fadeIn } from '@/lib/animations';
import { DashboardTour } from '@/components/tour/DashboardTour';
import { useApp } from '@/contexts/AppContext';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useApp();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <DashboardTour />
        {/* key={role} forces a full remount of the page content when the role
            changes — this clears any stale local state in page components     */}
        <motion.main
          key={role}
          className="flex-1 overflow-y-auto p-4 md:p-6"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
