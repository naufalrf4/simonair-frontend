import { Sidebar } from '@/components/common/sidebar';
import { Navbar } from '@/components/common/navbar';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { ProtectedRoute } from '@/features/authentication/components/ProtectedRoute';
import BottomNav from '@/components/common/bottom-nav';

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar hanya di desktop */}
        {/* <div
          className={`hidden lg:block h-screen sticky top-0 z-30 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <Sidebar defaultCollapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        </div> */}

        <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
          <Navbar />

          <main className="flex-1 container mx-auto p-6">
            <Outlet />
          </main>
          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
