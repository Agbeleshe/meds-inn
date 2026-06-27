import { Outlet } from 'react-router-dom';
import { PublicNav } from '@/components/layouts/PublicNav';
import { PublicFooter } from '@/components/layouts/PublicFooter';

/** Root public layout — nav + page content + footer */
export function SiteLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav />
      <Outlet />
      <PublicFooter />
    </div>
  );
}
