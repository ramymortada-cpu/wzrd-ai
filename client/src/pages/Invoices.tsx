import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function InvoicesPage() {
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const utils = trpc.useUtils();
  const { data } = trpc.invoices.list.useQuery();
  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      setClientId("");
      setProjectId("");
      setAmount("");
      void utils.invoices.list.invalidate();
    },
  });
  const paidMutation = trpc.invoices.markAsPaid.useMutation({
    onSuccess: () => void utils.invoices.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
            <Input placeholder="Project ID (optional)" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <Input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button
            disabled={!clientId || !amount || createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                clientId: Number(clientId),
                projectId: projectId ? Number(projectId) : undefined,
                amount,
                currency: "EGP",
              })
            }
          >
            Create Invoice
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>List</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data ?? []).map((row) => (
            <div key={row.id} className="border rounded-md p-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">Invoice #{row.id}</div>
                <div className="text-xs text-muted-foreground">
                  status: {row.status} | amount: {row.amount} {row.currency}
                </div>
              </div>
              {row.status !== "paid" && (
                <Button size="sm" onClick={() => paidMutation.mutate({ id: row.id })}>
                  Mark Paid
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
