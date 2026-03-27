import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BlogStatus = "draft" | "published";

type BlogFormState = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  status: BlogStatus;
};

function makeAutoSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .slice(0, 100);
}

const EMPTY_FORM: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  status: "draft",
};

export default function BlogAdminPage() {
  const utils = trpc.useUtils();
  const postsQuery = trpc.blog.adminList.useQuery({ limit: 200, offset: 0 }, { retry: false });

  const createMutation = trpc.blog.adminCreate.useMutation({
    onSuccess: async () => {
      await utils.blog.adminList.invalidate();
    },
  });
  const updateMutation = trpc.blog.adminUpdate.useMutation({
    onSuccess: async () => {
      await utils.blog.adminList.invalidate();
    },
  });
  const deleteMutation = trpc.blog.adminDelete.useMutation({
    onSuccess: async () => {
      await utils.blog.adminList.invalidate();
    },
  });

  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState<BlogFormState>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (slugTouched) return;
    const autoSlug = makeAutoSlug(form.title);
    setForm((p) => ({ ...p, slug: autoSlug }));
  }, [form.title, slugTouched]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.slug.trim().length >= 3 &&
      form.content.trim().length > 0 &&
      !isSaving
    );
  }, [form, isSaving]);

  const openNew = () => {
    setErrorMsg("");
    setSlugTouched(false);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (p: {
    id: number;
    title: string | null;
    slug: string | null;
    excerpt: string | null;
    content: string | null;
    coverImage: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    status: BlogStatus | null;
  }) => {
    setErrorMsg("");
    setSlugTouched(true);
    setForm({
      id: p.id,
      title: p.title ?? "",
      slug: p.slug ?? "",
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      coverImage: p.coverImage ?? "",
      seoTitle: p.seoTitle ?? "",
      seoDescription: p.seoDescription ?? "",
      seoKeywords: p.seoKeywords ?? "",
      status: (p.status ?? "draft") as BlogStatus,
    });
    setOpen(true);
  };

  const submit = async () => {
    setErrorMsg("");
    try {
      if (!form.id) {
        await createMutation.mutateAsync({
          slug: form.slug.trim(),
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || null,
          content: form.content,
          coverImage: form.coverImage.trim() || null,
          status: form.status,
          seoTitle: form.seoTitle.trim() || null,
          seoDescription: form.seoDescription.trim() || null,
          seoKeywords: form.seoKeywords.trim() || null,
          publishedAt: null,
        });
      } else {
        await updateMutation.mutateAsync({
          id: form.id,
          slug: form.slug.trim(),
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || null,
          content: form.content,
          coverImage: form.coverImage.trim() || null,
          status: form.status,
          seoTitle: form.seoTitle.trim() || null,
          seoDescription: form.seoDescription.trim() || null,
          seoKeywords: form.seoKeywords.trim() || null,
        });
      }
      setOpen(false);
    } catch (e) {
      setErrorMsg((e as { message?: string } | undefined)?.message || "Failed to save post.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Blog CMS</h1>
          <p className="text-sm text-zinc-400">Draft + Published posts. Owner-only.</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          مقال جديد
        </Button>
      </div>

      <Card className="rounded-2xl border-zinc-800/60 bg-zinc-950/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-zinc-100">All posts</CardTitle>
        </CardHeader>
        <CardContent>
          {postsQuery.isLoading ? (
            <div className="text-sm text-zinc-400">Loading…</div>
          ) : postsQuery.error ? (
            <div className="text-sm text-red-300">Failed to load posts.</div>
          ) : (
            <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(postsQuery.data ?? []).map((p: {
                    id: number;
                    title: string | null;
                    slug: string | null;
                    status: BlogStatus | null;
                    publishedAt: Date | string | null;
                    excerpt: string | null;
                    content: string | null;
                    coverImage: string | null;
                    seoTitle: string | null;
                    seoDescription: string | null;
                    seoKeywords: string | null;
                  }) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-zinc-100">
                        <div className="flex flex-col">
                          <span>{p.title}</span>
                          <span className="text-xs text-zinc-500">/{p.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            p.status === "published"
                              ? "inline-flex rounded-full bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-xs border border-emerald-500/20"
                              : "inline-flex rounded-full bg-zinc-500/10 text-zinc-300 px-2 py-0.5 text-xs border border-zinc-500/20"
                          }
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm">
                        {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("ar-EG") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button variant="outline" className="border-zinc-800/60" onClick={() => openEdit(p)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              const ok = window.confirm("Delete this post?");
                              if (!ok) return;
                              deleteMutation.mutate({ id: p.id });
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(postsQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-zinc-400">
                        No posts yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-2xl border-zinc-800/60 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">{form.id ? "Edit post" : "New post"}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Markdown content + SEO fields. Public endpoints only expose published posts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((p) => ({ ...p, slug: e.target.value }));
                }}
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                className="min-h-24 bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                className="min-h-64 bg-zinc-950/30 border-zinc-800/60 font-mono text-xs"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cover Image (URL)</Label>
              <Input
                value={form.coverImage}
                onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>SEO Title</Label>
              <Input
                value={form.seoTitle}
                onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))}
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>SEO Keywords</Label>
              <Input
                value={form.seoKeywords}
                onChange={(e) => setForm((p) => ({ ...p, seoKeywords: e.target.value }))}
                className="bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>SEO Description</Label>
              <Textarea
                value={form.seoDescription}
                onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))}
                className="min-h-24 bg-zinc-950/30 border-zinc-800/60"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v as BlogStatus }))}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full bg-zinc-950/30 border-zinc-800/60">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="published">published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" className="border-zinc-800/60" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canSubmit} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

