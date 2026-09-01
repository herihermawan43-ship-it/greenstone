import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";

export default function Export() {
  const [q, setQ] = useState("");
  const { data: countries, isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get("/countries")).data,
  });

  const grouped = useMemo(() => {
    const list = (countries || []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    const map = {};
    list.forEach((c) => {
      (map[c.region_label] = map[c.region_label] || []).push(c);
    });
    return Object.entries(map);
  }, [countries, q]);

  return (
    <main data-testid="export-page">
      <SEO
        title="Export Markets — Worldwide Natural Stone Shipping | PT. Murfy Alam Indonesia"
        description={`PT. Murfy Alam Indonesia exports Sukabumi Green Stone (Pedra Bali) to ${countries?.length || "180+"} countries worldwide. Find shipping routes, transit times and supply details for your market.`}
        keywords="natural stone export worldwide, sukabumi green stone supplier, pedra bali international shipping, indonesia stone exporter countries"
        path="/export"
      />

      <section className="border-b border-line bg-surface">
        <div className="container-x pb-16 pt-44">
          <Reveal>
            <SectionTag num="—" label="EXPORT MARKETS" />
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              We Ship to Every Corner of the World
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">
              {countries ? `${countries.length} countries.` : "180+ countries."} One factory. Select your market for
              shipping routes, transit times and quotation details.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mt-10 max-w-md">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-brass" />
              <input
                data-testid="export-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search your country…"
                className="w-full border-b border-line bg-transparent py-3 pl-8 text-base text-bone placeholder:text-ash/60 focus:border-brass focus:outline-none"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-24">
        {isLoading ? (
          <div className="py-20 text-center text-ash">Loading markets…</div>
        ) : grouped.length === 0 ? (
          <div className="py-20 text-center text-ash" data-testid="export-no-results">
            No country found — contact us directly, we ship worldwide.
          </div>
        ) : (
          <div className="space-y-20">
            {grouped.map(([region, list], gi) => (
              <div key={region} data-testid={`export-region-${region.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                <Reveal>
                  <div className="mb-8 flex items-baseline gap-4 border-b border-line pb-4">
                    <h2 className="font-serif text-2xl text-bone sm:text-3xl">{region}</h2>
                    <span className="font-mono text-xs text-brass">{list.length}</span>
                  </div>
                </Reveal>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((c, i) => (
                    <Reveal key={c.slug} delay={Math.min(i * 0.02, 0.3)}>
                      <Link
                        to={`/export/${c.slug}`}
                        data-testid={`export-country-${c.slug}`}
                        className="group flex items-center justify-between gap-3 border border-transparent px-4 py-3 transition-colors duration-300 hover:border-line hover:bg-surface"
                      >
                        <span className="text-sm text-ash transition-colors duration-300 group-hover:text-bone">{c.name}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-brass opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
