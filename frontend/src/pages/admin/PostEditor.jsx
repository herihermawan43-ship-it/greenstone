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
import RichTextEditor from "@/components/admin/RichTextEditor";
import SeoFields from "@/components/admin/SeoFields";

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

// Keyed on `id` so navigating directly between two edit URLs (e.g. via
// browser back/forward) remounts the form instead of reusing stale state
// from whichever post was being edited before.
export default function PostEditor() {
  const { id } = useParams();
  return <PostEditorForm key={id || "new"} id={id} />;
}

function PostEditorForm({ id }) {
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  const { data: posts, isError } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => (await api.get("/admin/posts-all")).data,
    enabled: !isNew,
  });

  useEffect(() => {
    if (isNew || loaded || !posts) return;
    const post = posts.find((p) => p.id === id);
    if (post) {
      setForm(toForm(post));
      setLoaded(true);
    }
  }, [isNew, loaded, posts, id]);

  const notFound = !isNew && posts && !loaded && !posts.some((p) => p.id === id);

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target ? e.target.value : e }));

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post("/admin/posts", toPayload(form));
        toast.success("Article created.");
      } else {
        await api.put(`/admin/posts/${id}`, toPayload(form));
        toast.success("Article updated.");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/admin/blog");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isError) {
    return <div className="text-red-400" data-testid="post-editor-error">Failed to load this article. Try refreshing the page.</div>;
  }

  if (notFound) {
    return (
      <div data-testid="post-editor-not-found">
        <p className="text-muted-foreground">This article no longer exists — it may have been deleted.</p>
        <button onClick={() => navigate("/admin/blog")} className="mt-4 text-sm text-brass hover:underline">
          Back to Blog
        </button>
      </div>
    );
  }

  if (!isNew && !loaded) {
    return <div className="text-muted-foreground" data-testid="post-editor-loading">Loading…</div>;
  }

  return (
    <div className="max-w-4xl" data-testid="post-editor">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/blog")}
            className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-brass"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
          </button>
          <h1 className="font-serif text-4xl font-medium">{isNew ? "New Article" : "Edit Article"}</h1>
        </div>
        <button
          onClick={save}
          disabled={saving || !form.title}
          data-testid="post-form-save"
          className="flex items-center gap-2 bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Article"}
        </button>
      </div>

      <div className="mt-10 grid gap-5 pb-16 sm:grid-cols-2">
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
        <div className="sm:col-span-2">
          <RichTextEditor value={form.content} onChange={set("content")} label="Content" />
        </div>
        <div className="sm:col-span-2">
          <ImageUpload value={form.image} onChange={set("image")} label="Feature Image (Upload or URL)" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tags (comma separated)</Label>
          <Input data-testid="post-form-tags" value={form.tagsText} onChange={set("tagsText")} className="border-border bg-ink text-bone" />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch id="post-published" data-testid="post-form-published" checked={form.published} onCheckedChange={(v) => set("published")(v)} />
          <Label htmlFor="post-published" className="text-xs text-muted-foreground">Published</Label>
        </div>
        <div className="sm:col-span-2">
          <SeoFields
            seoTitle={form.seo_title}
            seoDesc={form.seo_desc}
            onSeoTitleChange={set("seo_title")}
            onSeoDescChange={set("seo_desc")}
            fallbackTitle={form.title}
            path={`/blog/${form.slug || "your-article-slug"}`}
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving || !form.title}
        data-testid="post-form-save-bottom"
        className="mb-16 w-full bg-moss py-3 text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Article"}
      </button>
    </div>
  );
}
