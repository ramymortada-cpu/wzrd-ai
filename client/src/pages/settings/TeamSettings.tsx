import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TeamSettings() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const utils = trpc.useUtils();

  const { data: members, isLoading } = trpc.workspaces.getMembers.useQuery();
  const inviteMutation = trpc.workspaces.inviteMember.useMutation({
    onSuccess: () => {
      setEmail("");
      void utils.workspaces.getMembers.invalidate();
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Team Members</h3>
      <div className="flex gap-2 items-center">
        <Input
          placeholder="member@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "editor" | "viewer")}
          className="h-10 rounded-md border px-2 bg-background"
        >
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
        <Button
          disabled={!email || inviteMutation.isPending}
          onClick={() => inviteMutation.mutate({ email, role })}
        >
          Invite
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell>Loading...</TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          ) : (
            (members ?? []).map((m) => (
              <TableRow key={m.userId}>
                <TableCell>{m.name ?? "-"}</TableCell>
                <TableCell>{m.email ?? "-"}</TableCell>
                <TableCell>{m.role}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
