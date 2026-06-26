/**
 * RoleBasedIndex
 *
 * Smart index rendered at /dashboard.
 * Reads the current role from AppContext and:
 *  - mother  → renders MotherDashboardPage
 *  - admin / nurse / doctor → renders DashboardOverview
 *
 * Using a single route with role-aware rendering keeps the URL clean
 * and guarantees the correct content always appears after a role switch.
 */

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import DashboardOverview from '@/pages/DashboardOverview';
import MotherDashboardPage from '@/pages/MotherDashboardPage';

export function RoleBasedIndex() {
  const { role } = useApp();
  if (role === 'mother') return <MotherDashboardPage />;
  return <DashboardOverview />;
}
