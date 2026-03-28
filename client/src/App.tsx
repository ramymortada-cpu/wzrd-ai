import React, { Suspense, lazy } from "react";
import { Route, Switch, useLocation } from "wouter";

// WZRD AI — Public funnel pages
const WelcomePage = lazy(() => import("./pages/Welcome"));
const Home = lazy(() => import("./pages/Home"));
const Tools = lazy(() => import("./pages/Tools"));
const Pricing = lazy(() => import("./pages/Pricing"));

const WZRD_PREMIUM_SHELL_RE =
  /^\/(?:signup|login|pricing|dashboard|my-brand|tools)(?:\/|$)/i;

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-gray-400">
          جاري التحميل…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function PremiumShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
    </div>
  );
}

function AppRoutes() {
  const [loc] = useLocation();
  const useShell = WZRD_PREMIUM_SHELL_RE.test(loc);

  const routes = (
    <Switch>
      <Route path="/">
        {() => (
          <SuspenseWrapper>
            <WelcomePage />
          </SuspenseWrapper>
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <SuspenseWrapper>
            <Home />
          </SuspenseWrapper>
        )}
      </Route>
      <Route path="/tools">
        {() => (
          <SuspenseWrapper>
            <Tools />
          </SuspenseWrapper>
        )}
      </Route>
      <Route path="/pricing">
        {() => (
          <SuspenseWrapper>
            <Pricing />
          </SuspenseWrapper>
        )}
      </Route>
      <Route>
        <div
          className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-600 dark:bg-gray-950 dark:text-gray-400"
          dir="rtl"
        >
          <p>الصفحة غير موجودة</p>
        </div>
      </Route>
    </Switch>
  );

  return useShell ? <PremiumShell>{routes}</PremiumShell> : routes;
}

export default function App() {
  return <AppRoutes />;
}
