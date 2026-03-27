import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditLogsSettings() {
  const { data, isLoading } = trpc.workspaces.auditLogs.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {(data ?? []).map((log) => (
          <div key={log.id} className="rounded-lg border p-3">
            <div className="text-sm font-medium">
              {log.action.toUpperCase()} {log.entity} #{log.entityId}
            </div>
            <div className="text-xs text-muted-foreground">
              userId: {log.userId ?? "-"} | {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
