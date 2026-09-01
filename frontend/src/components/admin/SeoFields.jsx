import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function Counter({ length, min, max }) {
  const color = length === 0
    ? "text-muted-foreground"
    : length > max ? "text-red-400" : length < min ? "text-amber-400" : "text-moss";
  return <span className={`font-mono text-[10px] ${color}`}>{length}/{max}</span>;
}

export default function SeoFields({ seoTitle, seoDesc, onSeoTitleChange, onSeoDescChange, fallbackTitle, path }) {
  const displayTitle = seoTitle || fallbackTitle || "Untitled";
  const displayUrl = `greenstonesupplier.com${path || ""}`;

  return (
    <div className="space-y-4 border border-border bg-ink/50 p-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SEO Title</Label>
          <Counter length={seoTitle.length} min={30} max={60} />
        </div>
        <Input data-testid="post-form-seo-title" value={seoTitle} onChange={onSeoTitleChange} className="border-border bg-ink text-bone" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SEO Description</Label>
          <Counter length={seoDesc.length} min={70} max={160} />
        </div>
        <Textarea rows={2} data-testid="post-form-seo-desc" value={seoDesc} onChange={onSeoDescChange} className="border-border bg-ink text-bone" />
      </div>
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Google Preview</p>
        <div className="bg-white p-4" style={{ fontFamily: "arial, sans-serif" }}>
          <p className="truncate text-sm text-[#202124]">{displayUrl}</p>
          <p className="mt-0.5 truncate text-lg text-[#1a0dab]">{displayTitle}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-[#4d5156]">
            {seoDesc || "Add a meta description so it shows up here the way it will in Google's results."}
          </p>
        </div>
      </div>
    </div>
  );
}
