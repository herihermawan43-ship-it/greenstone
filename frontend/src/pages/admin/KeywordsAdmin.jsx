import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const EMPTY = { name: "", slug: "", summary: "" };

export default function KeywordsAdmin() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: keywords, isLoading } = useQuery({
    queryKey: ["keywords"],
    queryFn: async () => (await api.get("/keywords")).data,
  });
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get("/countries")).data,
  });

  const countryCount = countries?.length || 0;
  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (k) => { setForm({ name: k.name, slug: k.slug, summary: k.summary || "" }); setEditing(k); };
  const close = () => setEditing(null);

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/admin/keywords", form);
        toast.success(`Keyword created — ${countryCount} new SEO pages are now live.`);
      } else {
        await api.put(`/admin/keywords/${editing.id}`, form);
        toast.success("Keyword updated.");
      }
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      close();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (k) => {
    if (!window.confirm(`Delete "${k.name}"? Its ${countryCount} supplier pages will be removed from the sitemap.`)) return;
    try {
      await api.delete(`/admin/keywords/${k.id}`);
      toast.success("Keyword deleted.");
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div data-testid="admin-keywords">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium">SEO Keywords</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each keyword automatically generates {countryCount} supplier pages — one per country — at
            /supplier/&#123;keyword&#125;/&#123;country&#125;, all included in the sitemap.
            {keywords && <> Currently: <span className="text-brass">{keywords.length * countryCount} pages</span> from {keywords.length} keywords.</>}
          </p>
        </div>
        <button
          onClick={openNew}
          data-testid="keyword-add-btn"
          className="flex items-center gap-2 bg-moss px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight"
        >
          <Plus className="h-4 w-4" /> New Keyword
        </button>
      </div>

      <div className="mt-8 border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Keyword</TableHead>
              <TableHead className="text-muted-foreground">Summary</TableHead>
              <TableHead className="text-muted-foreground">Pages</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border"><TableCell colSpan={4} className="text-muted-foreground">Loading…</TableCell></TableRow>
            ) : (
              (keywords || []).map((k) => (
                <TableRow key={k.id} className="border-border" data-testid={`keyword-row-${k.slug}`}>
                  <TableCell>
                    <div className="text-sm text-bone">{k.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">/supplier/{k.slug}/…</div>
                  </TableCell>
                  <TableCell className="max-w-sm text-xs text-muted-foreground">{k.summary}</TableCell>
                  <TableCell className="font-mono text-xs text-brass">{countryCount}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/supplier/${k.slug}/australia`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`keyword-preview-${k.slug}`}
                      className="mr-3 inline-block text-muted-foreground transition-colors hover:text-brass"
                      aria-label="Preview"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button data-testid={`keyword-edit-${k.slug}`} onClick={() => openEdit(k)} className="mr-3 text-muted-foreground transition-colors hover:text-brass" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button data-testid={`keyword-delete-${k.slug}`} onClick={() => remove(k)} className="text-muted-foreground transition-colors hover:text-red-400" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent className="border-border bg-card sm:max-w-lg" data-testid="keyword-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing === "new" ? "New Keyword" : "Edit Keyword"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Keyword *</Label>
              <Input data-testid="keyword-name-input" value={form.name} onChange={set("name")} placeholder="e.g. Green Slate Tiles" className="mt-1.5 border-border bg-ink" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL Slug (optional, auto from keyword)</Label>
              <Input data-testid="keyword-slug-input" value={form.slug} onChange={set("slug")} placeholder="green-slate-tiles" className="mt-1.5 border-border bg-ink font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Short Summary (used inside page copy)</Label>
              <Textarea data-testid="keyword-summary-input" value={form.summary} onChange={set("summary")} rows={3} placeholder="e.g. calibrated green slate tiles for pools and wet areas" className="mt-1.5 border-border bg-ink" />
            </div>
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              data-testid="keyword-save-btn"
              className="w-full bg-moss py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Keyword"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
