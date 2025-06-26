import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const invalidateQueriesOnAuth = () => {
  window.addEventListener("auth:login", () => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
  });

  window.addEventListener("auth:logout", () => {
    queryClient.clear();
  });
};
