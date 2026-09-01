import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";

export default function SeoExplorer() {
  const [q, setQ] = useState("");

  const { data: keywords, isLoading: keywordsLoading } = useQuery({
    queryKey: ["keywords"],
    queryFn: async () => (await api.get("/keywords")).data,
  });

  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get("/countries")).data,
  });

  const pages = useMemo(() => {
    if (!keywords || !countries) return [];
    return keywords.flatMap((kw) =>
      countries.map((c) => ({
        keyword: kw.name,
        keywordSlug: kw.slug,
        country: c.name,
        countrySlug: c.slug,
        region: c.region_label,
        url: `/supplier/${kw.slug}/${c.slug}`,
      }))
    );
  }, [keywords, countries]);

  const filtered = useMemo(() => {
    if (!q) return pages;
    const lower = q.toLowerCase();
    return pages.filter(
      (p) =>
        p.keyword.toLowerCase().includes(lower) ||
        p.country.toLowerCase().includes(lower) ||
        p.region.toLowerCase().includes(lower)
    );
  }, [pages, q]);

  const isLoading = keywordsLoading || countriesLoading;
  const total = pages.length;

  return (
    <div data-testid="seo-explorer">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-medium">Programmatic SEO Pages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLoading
            ? "Loading…"
            : `${total.toLocaleString()} pages generated from ${keywords?.length || 0} keywords × ${countries?.length || 0} countries.`}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search keyword, country, or region…"
            className="border-border bg-card pl-10"
          />
        </div>
      </div>

      <div className="border border-border bg-card">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading pages…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {q ? "No pages match your search." : "No pages yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Keyword</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Country</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Region</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Preview</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((page, i) => (
                  <tr
                    key={`${page.keywordSlug}-${page.countrySlug}`}
                    className="border-b border-border hover:bg-surface"
                    data-testid={`seo-page-row-${i}`}
                  >
                    <td className="px-4 py-3 text-bone">{page.keyword}</td>
                    <td className="px-4 py-3 text-ash">{page.country}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{page.region}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`seo-page-link-${i}`}
                        className="inline-block text-muted-foreground transition-colors hover:text-brass"
                        aria-label="Open page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
                Showing first 100 of {filtered.length} pages. Refine your search to see more.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2 text-xs text-muted-foreground">
        <p>💡 Tip: Click the preview icon to open and test any programmatic page.</p>
        <p>🔍 Each page is auto-generated with context-specific content based on the keyword and country combination.</p>
      </div>
    </div>
  );
}
