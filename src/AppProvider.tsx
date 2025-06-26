import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/authentication/context/AuthContext";
import { invalidateQueriesOnAuth } from "@/utils/queryClient";
import { Toaster } from "sonner";
import { useMediaQuery } from "react-responsive";

const queryClient = new QueryClient({
defaultOptions: {
  queries: {
    staleTime: 10 * 60 * 1000,
    retry: 1,
  },
},
});

interface AppProviderProps {
children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
useEffect(() => {
  invalidateQueriesOnAuth();
}, []);

const isMobile = useMediaQuery({ maxWidth: 640 });

return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster
        position={isMobile ? "top-center" : "bottom-right"}
        richColors
        closeButton
      />
      {children}
    </AuthProvider>
  </QueryClientProvider>
);
}
