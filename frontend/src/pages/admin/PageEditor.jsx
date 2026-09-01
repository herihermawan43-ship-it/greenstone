import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { pageSchemas, pageTitles } from "./pageSchemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function setDeep(obj, path, value) {
  const keys = path.split(".");
  const clone = structuredClone(obj ?? {});
  let cur = clone;
  for (const k of keys.slice(0, -1)) {
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

function getDeep(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const emptyItem = (fields) => Object.fromEntries(fields.map((f) => [f.key, ""]));

function renderField(spec, value, onChange, path) {
  const label = (
    <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{spec.label}</Label>
  );

  if (spec.type === "group") {
    return (
      <div className="space-y-5">
        {spec.fields.map((f) => (
          <div key={f.key}>
            {renderField(f, getDeep(value, f.key), (v) => onChange(setDeep(value, f.key, v)), `${path}.${f.key}`)}
          </div>
        ))}
      </div>
    );
  }

  if (spec.type === "textarea") {
    return (
      <div className="space-y-1.5" data-testid={`field-${path.replace(/\./g, "-")}`}>
        {label}
        <Textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="border-border bg-ink text-sm text-bone"
        />
      </div>
    );
  }

  if (spec.type === "image") {
    return (
      <div className="space-y-1.5" data-testid={`field-${path.replace(/\./g, "-")}`}>
        {label}
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="border-border bg-ink font-mono text-xs text-bone"
        />
        {value && (
          <img src={value} alt="preview" className="mt-2 h-24 w-40 border border-border object-cover" />
        )}
      </div>
    );
  }

  if (spec.type === "stringlist") {
    return (
      <div className="space-y-1.5" data-testid={`field-${path.replace(/\./g, "-")}`}>
        {label}
        <Textarea
          rows={Math.max(3, (value || []).length)}
          value={(value || []).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          className="border-border bg-ink text-sm text-bone"
        />
      </div>
    );
  }

  if (spec.type === "array") {
    const items = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-3" data-testid={`field-${path.replace(/\./g, "-")}`}>
        {label}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-border bg-ink/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
                  {spec.itemLabel} {i + 1}
                </span>
                <button
                  type="button"
                  data-testid={`remove-${path.replace(/\./g, "-")}-${i}`}
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                  className="text-muted-foreground transition-colors hover:text-red-400"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {spec.fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}>
                    {renderField(
                      f,
                      item?.[f.key],
                      (v) => onChange(items.map((it, j) => (j === i ? { ...it, [f.key]: v } : it))),
                      `${path}-${i}-${f.key}`
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          data-testid={`add-${path.replace(/\./g, "-")}`}
          onClick={() => onChange([...items, emptyItem(spec.fields)])}
          className="flex items-center gap-2 border border-dashed border-border px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-brass hover:text-brass"
        >
          <Plus className="h-3.5 w-3.5" /> Add {spec.itemLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5" data-testid={`field-${path.replace(/\./g, "-")}`}>
      {label}
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-ink text-sm text-bone"
      />
    </div>
  );
}

export default function PageEditor() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const schema = pageSchemas[slug];
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: page, isLoading } = useQuery({
    queryKey: ["admin-page", slug],
    queryFn: async () => (await api.get(`/pages/${slug}`)).data,
    enabled: !!schema,
  });

  useEffect(() => {
    if (page?.content && content === null) setContent(page.content);
  }, [page, content]);

  if (!schema) {
    return <div className="text-muted-foreground" data-testid="page-editor-unknown">Unknown page: {slug}</div>;
  }

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/pages/${slug}`, { content });
      queryClient.invalidateQueries({ queryKey: ["page", slug] });
      toast.success(`${pageTitles[slug]} saved. Changes are live.`);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl" data-testid={`page-editor-${slug}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium">{pageTitles[slug]}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit every section of this page. Changes go live immediately after saving.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || !content}
          data-testid="page-save-btn"
          className="flex items-center gap-2 bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save & Publish"}
        </button>
      </div>

      {isLoading || !content ? (
        <div className="mt-16 text-muted-foreground">Loading content…</div>
      ) : (
        <div className="mt-10 space-y-8">
          {schema.map((section) => (
            <section key={section.key} className="border border-border bg-card p-6">
              <h2 className="mb-6 border-b border-border pb-3 font-serif text-xl text-brass">{section.label}</h2>
              {renderField(
                section,
                content[section.key],
                (v) => setContent(setDeep(content, section.key, v)),
                section.key
              )}
            </section>
          ))}
          <div className="flex justify-end pb-8">
            <button
              onClick={save}
              disabled={saving}
              data-testid="page-save-btn-bottom"
              className="flex items-center gap-2 bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save & Publish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
