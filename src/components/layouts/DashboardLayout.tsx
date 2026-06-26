import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { fadeIn } from '@/lib/animations';
import { DashboardTour } from '@/components/tour/DashboardTour';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <DashboardTour />
        <motion.main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          key="dashboard-main"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
