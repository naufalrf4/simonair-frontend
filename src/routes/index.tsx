import { createFileRoute, redirect } from '@tanstack/react-router';
import UserDashboard from '@/features/dashboard/components/UserDashboard';
import Navbar from '@/components/common/navbar';

export const Route = createFileRoute('/')({
  // beforeLoad: async () => {
  //   return redirect({
  //     to: '/login',
  //   });
  // },
  component: () => {
    return (
      <>
        <Navbar />
        <UserDashboard />
      </>
    );
  },
});
