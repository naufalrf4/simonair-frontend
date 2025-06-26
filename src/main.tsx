import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';
import { LoadingPage } from './components/common/loading-page';

const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <LoadingPage />,
  defaultPreload: 'intent',
  defaultPendingMs: 1000,
  defaultPendingMinMs: 500,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
  