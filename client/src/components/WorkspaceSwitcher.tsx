import { trpc } from "@/lib/trpc";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function WorkspaceSwitcher() {
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const { data, isLoading } = trpc.workspaces.list.useQuery();

  if (isLoading) {
    return <div className="px-2 text-xs text-muted-foreground">Loading workspaces...</div>;
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="px-2 pb-2">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
        Workspace
      </label>
      <select
        className="w-full h-9 rounded-md border bg-background px-2 text-sm"
        value={activeWorkspaceId}
        onChange={(e) => setActiveWorkspaceId(Number(e.target.value))}
      >
        {data.map((ws) => (
          <option key={ws.workspaceId} value={ws.workspaceId}>
            {ws.name} ({ws.role})
          </option>
        ))}
      </select>
    </div>
  );
}
