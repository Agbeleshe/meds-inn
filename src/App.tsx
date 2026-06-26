import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TourProvider } from '@/contexts/TourContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { SplashScreen } from '@/components/SplashScreen';
import { CookieConsentModal } from '@/components/CookieConsentModal';
import { HEX_IMAGES } from '@/components/landing/HexagonalGalleryHero';
import { preloadImages } from '@/lib/preloadImages';
import type { PreloadProgress } from '@/lib/preloadImages';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

// Dashboard pages
import DashboardOverview from './pages/DashboardOverview';
import MothersPage from './pages/MothersPage';
import MotherProfilePage from './pages/MotherProfilePage';
import PregnancyTimelinePage from './pages/PregnancyTimelinePage';
import CarePlansPage from './pages/CarePlansPage';
import MedicationRemindersPage from './pages/MedicationRemindersPage';
import AppointmentsPage from './pages/AppointmentsPage';
import VideoConsultationsPage from './pages/VideoConsultationsPage';
import AICareBriefsPage from './pages/AICareBriefsPage';
import MessagesPage from './pages/MessagesPage';
import BabyCarePage from './pages/BabyCarePage';
import DocumentsPage from './pages/DocumentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import ArchitecturePage from './pages/ArchitecturePage';
import MotherDashboardPage from './pages/MotherDashboardPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [loadProgress, setLoadProgress] = useState<PreloadProgress>({ loaded: 0, total: HEX_IMAGES.length, percent: 0 });
  const handleSplashDone = useCallback(() => setSplashDone(true), []);
  const started = useRef(false);

  // Preload all honeycomb images on mount, tracking progress so the
  // SplashScreen can show a real progress bar and only dismiss when ready.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const urls = HEX_IMAGES.map(({ src }) => src);
    preloadImages(urls, (p) => setLoadProgress(p));
  }, []);

  return (
    <ThemeProvider>
      <TourProvider>
      <AppProvider>
        {!splashDone && (
          <SplashScreen
            onDone={handleSplashDone}
            progress={loadProgress.percent}
            loaded={loadProgress.loaded}
            total={loadProgress.total}
          />
        )}
        <Router>
        {splashDone && <CookieConsentModal />}
        <IntersectObserver />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/terms" element={<TermsAndConditionsPage />} />

          {/* Dashboard — nested under layout (Outlet renders child) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="mother" element={<MotherDashboardPage />} />
            <Route path="mothers" element={<MothersPage />} />
            <Route path="mothers/:id" element={<MotherProfilePage />} />
            <Route path="timeline" element={<PregnancyTimelinePage />} />
            <Route path="care-plans" element={<CarePlansPage />} />
            <Route path="medications" element={<MedicationRemindersPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="video" element={<VideoConsultationsPage />} />
            <Route path="care-briefs" element={<AICareBriefsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="baby-care" element={<BabyCarePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="architecture" element={<ArchitecturePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
        </Router>
      </AppProvider>
      </TourProvider>
    </ThemeProvider>
  );
};

export default App;
