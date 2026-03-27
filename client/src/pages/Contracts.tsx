import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContractsPage() {
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();
  const { data } = trpc.contracts.list.useQuery();
  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      setClientId("");
      setProjectId("");
      setTitle("");
      setContent("");
      void utils.contracts.list.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Contracts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
            <Input placeholder="Project ID (optional)" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Textarea placeholder="Contract content" value={content} onChange={(e) => setContent(e.target.value)} />
          <Button
            disabled={!clientId || !title || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                clientId: Number(clientId),
                projectId: projectId ? Number(projectId) : undefined,
                title,
                content,
              })
            }
          >
            Create Contract
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>List</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data ?? []).map((row) => (
            <div key={row.id} className="border rounded-md p-3">
              <div className="font-medium">{row.title}</div>
              <div className="text-xs text-muted-foreground">
                status: {row.status} | client #{row.clientId} | project #{row.projectId ?? "-"}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
