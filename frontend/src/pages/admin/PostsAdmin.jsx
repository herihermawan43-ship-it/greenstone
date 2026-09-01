import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ImageUpload from "@/components/admin/ImageUpload";

const EMPTY = {
  title: "", slug: "", excerpt: "", content: "", image: "",
  author: "PT. Murfy Alam Indonesia", tagsText: "", published: true, seo_title: "", seo_desc: "",
};

const toForm = (p) => ({
  title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content, image: p.image,
  author: p.author, tagsText: (p.tags || []).join(", "), published: !!p.published,
  seo_title: p.seo_title || "", seo_desc: p.seo_desc || "",
});

const toPayload = (f) => ({
  title: f.title, slug: f.slug || undefined, excerpt: f.excerpt, content: f.content, image: f.image,
  author: f.author, tags: f.tagsText.split(",").map((s) => s.trim()).filter(Boolean),
  published: f.published, seo_title: f.seo_title, seo_desc: f.seo_desc,
});

export default function PostsAdmin() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [generating, setGenerating] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => (await api.get("/admin/posts-all")).data,
  });

  const { data: autoblog } = useQuery({
    queryKey: ["autoblog"],
    queryFn: async () => (await api.get("/admin/autoblog")).data,
  });

  const toggleAutoblog = async (enabled) => {
    try {
      await api.put("/admin/autoblog", { enabled, hour_utc: autoblog?.hour_utc ?? 2 });
      queryClient.invalidateQueries({ queryKey: ["autoblog"] });
      toast.success(enabled ? "Daily AI auto-posting enabled." : "Daily AI auto-posting paused.");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/admin/autoblog/run");
      toast.success(`AI article published: "${data.title}"`);
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["autoblog"] });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setGenerating(false);
    }
  };

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (p) => { setForm(toForm(p)); setEditing(p); };
  const close = () => setEditing(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e });

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/admin/posts", toPayload(form));
        toast.success("Article created.");
      } else {
        await api.put(`/admin/posts/${editing.id}`, toPayload(form));
        toast.success("Article updated.");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      close();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/posts/${p.id}`);
      toast.success("Article deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div data-testid="admin-posts">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium">Blog</h1>
          <p className="mt-2 text-sm text-muted-foreground">Journal articles shown at /blog. Paragraphs in content are separated by a blank line.</p>
        </div>
        <button
          onClick={openNew}
          data-testid="post-add-btn"
          className="flex items-center gap-2 bg-moss px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight"
        >
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      <div className="mt-8 border border-border bg-card p-6" data-testid="autoblog-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl">
              <Sparkles className="h-4 w-4 text-brass" /> AI Auto-Posting
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Publishes 1 SEO article per day automatically (rotating GPT-5.5, Claude Sonnet 4.6 & Gemini 3.1 Pro).
              {autoblog?.last_run_date && <> Last article: {autoblog.last_run_date}.</>}
              {autoblog?.last_error && <span className="text-red-400"> Last error: {autoblog.last_error}</span>}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Switch data-testid="autoblog-toggle" checked={!!autoblog?.enabled} onCheckedChange={toggleAutoblog} />
              <span className="text-xs text-muted-foreground">{autoblog?.enabled ? "On" : "Off"}</span>
            </div>
            <button
              onClick={generateNow}
              disabled={generating}
              data-testid="autoblog-generate-btn"
              className="flex items-center gap-2 border border-brass/50 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-brass transition-colors hover:bg-brass hover:text-ink disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Writing…" : "Generate Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border"><TableCell colSpan={3} className="text-muted-foreground">Loading…</TableCell></TableRow>
            ) : (
              (posts || []).map((p) => (
                <TableRow key={p.id} className="border-border" data-testid={`post-row-${p.slug}`}>
                  <TableCell>
                    <div className="text-sm text-bone">
                      {p.title}
                      {p.ai_generated && <span className="ml-2 rounded-sm bg-brass/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brass">AI</span>}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">/{p.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.published ? "default" : "secondary"} className={p.published ? "bg-moss text-white" : ""}>
                      {p.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button data-testid={`post-edit-${p.slug}`} onClick={() => openEdit(p)} className="mr-3 text-muted-foreground transition-colors hover:text-brass" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button data-testid={`post-delete-${p.slug}`} onClick={() => remove(p)} className="text-muted-foreground transition-colors hover:text-red-400" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && close()}>
        <DialogContent className="top-[5vh] max-h-[90vh] max-w-2xl translate-y-0 overflow-y-auto border-border bg-card text-bone" data-testid="post-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing === "new" ? "New Article" : "Edit Article"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Title *</Label>
              <Input data-testid="post-form-title" value={form.title} onChange={set("title")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slug (auto if empty)</Label>
              <Input data-testid="post-form-slug" value={form.slug} onChange={set("slug")} className="border-border bg-ink font-mono text-xs text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Author</Label>
              <Input data-testid="post-form-author" value={form.author} onChange={set("author")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Excerpt</Label>
              <Textarea rows={2} data-testid="post-form-excerpt" value={form.excerpt} onChange={set("excerpt")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Content (blank line = new paragraph)</Label>
              <Textarea rows={12} data-testid="post-form-content" value={form.content} onChange={set("content")} className="border-border bg-ink text-bone" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload
                value={form.image}
                onChange={set("image")}
                label="Feature Image (Upload or URL)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tags (comma separated)</Label>
              <Input data-testid="post-form-tags" value={form.tagsText} onChange={set("tagsText")} className="border-border bg-ink text-bone" />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch id="post-published" data-testid="post-form-published" checked={form.published} onCheckedChange={(v) => set("published")(v)} />
              <Label htmlFor="post-published" className="text-xs text-muted-foreground">Published</Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SEO Title</Label>
              <Input data-testid="post-form-seo-title" value={form.seo_title} onChange={set("seo_title")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SEO Description</Label>
              <Input data-testid="post-form-seo-desc" value={form.seo_desc} onChange={set("seo_desc")} className="border-border bg-ink text-bone" />
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving || !form.title}
            data-testid="post-form-save"
            className="mt-6 w-full bg-moss py-3 text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Article"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
