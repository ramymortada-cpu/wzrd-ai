import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { Route, Switch } from "wouter";
import superjson from "superjson";
import { trpc } from "./lib/trpc";
import Welcome from "./pages/Welcome";
import Tools from "./pages/Tools";
import Pricing from "./pages/Pricing";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/tools" component={Tools} />
      <Route path="/pricing" component={Pricing} />
      <Route>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-600 dark:bg-gray-950 dark:text-gray-400" dir="rtl">
          <p>الصفحة غير موجودة</p>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch: (url, options) =>
            fetch(url, {
              ...options,
              credentials: "include",
            }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
