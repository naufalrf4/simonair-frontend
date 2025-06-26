import { ShowForRole } from '@/features/authentication/components/ShowForRole';
import AdminDashboard from '@/features/dashboard/components/AdminDashboard';
import UserDashboard from '@/features/dashboard/components/UserDashboard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="">
      <ShowForRole roles={['admin']}>
        <AdminDashboard />
      </ShowForRole>
      <ShowForRole roles={['user']}>
        {/* Halo User */}
        <UserDashboard />
      </ShowForRole>
    </div>
  );
}
