import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const EMPTY = {
  name: "", slug: "", category: "Pool Tiles", short_desc: "", description: "", image: "",
  galleryText: "", finishesText: "", sizesText: "", applicationsText: "",
  featured: false, seo_title: "", seo_desc: "",
};

const toForm = (p) => ({
  name: p.name, slug: p.slug, category: p.category, short_desc: p.short_desc,
  description: p.description, image: p.image,
  galleryText: (p.gallery || []).join("\n"),
  finishesText: (p.finishes || []).join(", "),
  sizesText: (p.sizes || []).join(", "),
  applicationsText: (p.applications || []).join(", "),
  featured: !!p.featured, seo_title: p.seo_title || "", seo_desc: p.seo_desc || "",
});

const toPayload = (f) => ({
  name: f.name, slug: f.slug || undefined, category: f.category, short_desc: f.short_desc,
  description: f.description, image: f.image,
  gallery: f.galleryText.split("\n").map((s) => s.trim()).filter(Boolean),
  finishes: f.finishesText.split(",").map((s) => s.trim()).filter(Boolean),
  sizes: f.sizesText.split(",").map((s) => s.trim()).filter(Boolean),
  applications: f.applicationsText.split(",").map((s) => s.trim()).filter(Boolean),
  featured: f.featured, seo_title: f.seo_title, seo_desc: f.seo_desc,
});

export default function ProductsAdmin() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (p) => { setForm(toForm(p)); setEditing(p); };
  const close = () => setEditing(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e });

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/admin/products", toPayload(form));
        toast.success("Product created.");
      } else {
        await api.put(`/admin/products/${editing.id}`, toPayload(form));
        toast.success("Product updated.");
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      close();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Product deleted.");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium">Products</h1>
          <p className="mt-2 text-sm text-muted-foreground">The public catalogue at /products.</p>
        </div>
        <button
          onClick={openNew}
          data-testid="product-add-btn"
          className="flex items-center gap-2 bg-moss px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight"
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="mt-8 border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground">Category</TableHead>
              <TableHead className="text-muted-foreground">Featured</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border"><TableCell colSpan={4} className="text-muted-foreground">Loading…</TableCell></TableRow>
            ) : (
              (products || []).map((p) => (
                <TableRow key={p.id} className="border-border" data-testid={`product-row-${p.slug}`}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      {p.image && <img src={p.image} alt="" className="h-10 w-14 border border-border object-cover" />}
                      <div>
                        <div className="text-sm text-bone">{p.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-sm">{p.featured ? <span className="text-brass">Yes</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <button data-testid={`product-edit-${p.slug}`} onClick={() => openEdit(p)} className="mr-3 text-muted-foreground transition-colors hover:text-brass" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button data-testid={`product-delete-${p.slug}`} onClick={() => remove(p)} className="text-muted-foreground transition-colors hover:text-red-400" aria-label="Delete">
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card text-bone" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing === "new" ? "New Product" : "Edit Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Name *</Label>
              <Input data-testid="product-form-name" value={form.name} onChange={set("name")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slug (auto if empty)</Label>
              <Input data-testid="product-form-slug" value={form.slug} onChange={set("slug")} className="border-border bg-ink font-mono text-xs text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Category</Label>
              <Input data-testid="product-form-category" value={form.category} onChange={set("category")} className="border-border bg-ink text-bone" />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch id="product-featured" data-testid="product-form-featured" checked={form.featured} onCheckedChange={(v) => set("featured")(v)} />
              <Label htmlFor="product-featured" className="text-xs text-muted-foreground">Featured product</Label>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Short Description</Label>
              <Input data-testid="product-form-short-desc" value={form.short_desc} onChange={set("short_desc")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Full Description</Label>
              <Textarea rows={4} data-testid="product-form-description" value={form.description} onChange={set("description")} className="border-border bg-ink text-bone" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload
                value={form.image}
                onChange={set("image")}
                label="Main Image (Upload or URL)"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gallery URLs (one per line)</Label>
              <Textarea rows={3} data-testid="product-form-gallery" value={form.galleryText} onChange={set("galleryText")} className="border-border bg-ink font-mono text-xs text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Finishes (comma separated)</Label>
              <Input data-testid="product-form-finishes" value={form.finishesText} onChange={set("finishesText")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sizes (comma separated)</Label>
              <Input data-testid="product-form-sizes" value={form.sizesText} onChange={set("sizesText")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Applications (comma separated)</Label>
              <Input data-testid="product-form-applications" value={form.applicationsText} onChange={set("applicationsText")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SEO Title</Label>
              <Input data-testid="product-form-seo-title" value={form.seo_title} onChange={set("seo_title")} className="border-border bg-ink text-bone" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SEO Description</Label>
              <Input data-testid="product-form-seo-desc" value={form.seo_desc} onChange={set("seo_desc")} className="border-border bg-ink text-bone" />
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving || !form.name}
            data-testid="product-form-save"
            className="mt-6 w-full bg-moss py-3 text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Product"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
