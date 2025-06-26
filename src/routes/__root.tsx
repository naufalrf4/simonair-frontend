import { Outlet, createRootRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/common/not-found-page";
import { ErrorPage } from "@/components/common/error-page";
import { AppProvider } from "@/AppProvider";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  pendingComponent: () => <div>Loading...</div>,
});

function RootComponent() {
  return (
    <>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </>
  );
}
