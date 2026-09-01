import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/admin/ImageUpload";
import MultiImageUpload from "@/components/admin/MultiImageUpload";
import SeoFields from "@/components/admin/SeoFields";

const EMPTY = {
  name: "", slug: "", category: "Pool Tiles", short_desc: "", description: "", image: "",
  gallery: [], finishesText: "", sizesText: "", applicationsText: "",
  featured: false, seo_title: "", seo_desc: "",
};

const toForm = (p) => ({
  name: p.name, slug: p.slug, category: p.category, short_desc: p.short_desc,
  description: p.description, image: p.image,
  gallery: p.gallery || [],
  finishesText: (p.finishes || []).join(", "),
  sizesText: (p.sizes || []).join(", "),
  applicationsText: (p.applications || []).join(", "),
  featured: !!p.featured, seo_title: p.seo_title || "", seo_desc: p.seo_desc || "",
});

const toPayload = (f) => ({
  name: f.name, slug: f.slug || undefined, category: f.category, short_desc: f.short_desc,
  description: f.description, image: f.image,
  gallery: f.gallery || [],
  finishes: f.finishesText.split(",").map((s) => s.trim()).filter(Boolean),
  sizes: f.sizesText.split(",").map((s) => s.trim()).filter(Boolean),
  applications: f.applicationsText.split(",").map((s) => s.trim()).filter(Boolean),
  featured: f.featured, seo_title: f.seo_title, seo_desc: f.seo_desc,
});

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
    enabled: !isNew,
  });

  useEffect(() => {
    if (isNew || loaded || !products) return;
    const product = products.find((p) => p.id === id);
    if (product) {
      setForm(toForm(product));
      setLoaded(true);
    }
  }, [isNew, loaded, products, id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e });

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post("/admin/products", toPayload(form));
        toast.success("Product created.");
      } else {
        await api.put(`/admin/products/${id}`, toPayload(form));
        toast.success("Product updated.");
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/admin/products");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && !loaded) {
    return <div className="text-muted-foreground" data-testid="product-editor-loading">Loading…</div>;
  }

  return (
    <div className="max-w-4xl" data-testid="product-editor">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/products")}
            className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-brass"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
          </button>
          <h1 className="font-serif text-4xl font-medium">{isNew ? "New Product" : "Edit Product"}</h1>
        </div>
        <button
          onClick={save}
          disabled={saving || !form.name}
          data-testid="product-form-save"
          className="flex items-center gap-2 bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Product"}
        </button>
      </div>

      <div className="mt-10 grid gap-5 pb-16 sm:grid-cols-2">
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
          <ImageUpload value={form.image} onChange={set("image")} label="Main Image (Upload or URL)" />
        </div>
        <div className="sm:col-span-2" data-testid="product-form-gallery">
          <MultiImageUpload value={form.gallery} onChange={set("gallery")} label="Gallery Images (Upload or URL)" />
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
        <div className="sm:col-span-2">
          <SeoFields
            seoTitle={form.seo_title}
            seoDesc={form.seo_desc}
            onSeoTitleChange={set("seo_title")}
            onSeoDescChange={set("seo_desc")}
            fallbackTitle={form.name}
            path={`/products/${form.slug || "your-product-slug"}`}
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving || !form.name}
        data-testid="product-form-save-bottom"
        className="mb-16 w-full bg-moss py-3 text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Product"}
      </button>
    </div>
  );
}
