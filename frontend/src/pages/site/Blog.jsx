import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
};

export default function Blog() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data,
  });

  const [featured, ...rest] = posts || [];

  return (
    <main data-testid="blog-page">
      <SEO
        title="Journal | Stone Intelligence for Architects & Importers — PT. Murfy Alam Indonesia"
        description="Guides and insights on Sukabumi Green Stone, Pedra Bali specification, pool design, stone export logistics and resort maintenance."
        keywords="sukabumi green stone blog, pedra bali guide, natural stone export indonesia"
        path="/blog"
      />

      <section className="border-b border-line bg-surface">
        <div className="container-x pb-16 pt-44">
          <Reveal>
            <SectionTag num="—" label="THE JOURNAL" />
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              Stone Intelligence
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">
              Specification guides, export know-how and design insight from the source of Pedra Bali.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-24">
        {isLoading ? (
          <div className="py-20 text-center text-ash">Loading articles…</div>
        ) : (
          <>
            {featured && (
              <Reveal>
                <Link to={`/blog/${featured.slug}`} data-testid={`blog-featured-${featured.slug}`} className="group grid gap-10 border-b border-line pb-16 lg:grid-cols-2">
                  <div className="overflow-hidden">
                    <img
                      src={featured.image}
                      alt={featured.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass">{fmtDate(featured.created_at)}</span>
                    <h2 className="mt-4 font-serif text-3xl font-medium leading-tight text-bone transition-colors duration-300 group-hover:text-brass sm:text-4xl">
                      {featured.title}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-ash">{featured.excerpt}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brass">
                      Read Article <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )}
            <div className="mt-16 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 0.08}>
                  <Link to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`} className="group block">
                    <div className="overflow-hidden">
                      <img src={p.image} alt={p.title} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    </div>
                    <span className="mt-5 block font-mono text-[10px] uppercase tracking-[0.25em] text-brass">{fmtDate(p.created_at)}</span>
                    <h2 className="mt-3 font-serif text-2xl leading-snug text-bone transition-colors duration-300 group-hover:text-brass">{p.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-ash">{p.excerpt}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
