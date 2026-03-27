import { createContext, useContext, useMemo, useState } from "react";

type WorkspaceContextValue = {
  activeWorkspaceId: number;
  setActiveWorkspaceId: (id: number) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const STORAGE_KEY = "active-workspace-id";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const setActiveWorkspaceId = (id: number) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  };

  const value = useMemo(
    () => ({ activeWorkspaceId, setActiveWorkspaceId }),
    [activeWorkspaceId],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
