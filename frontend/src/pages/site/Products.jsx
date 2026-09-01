import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";

export default function Products() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  return (
    <main data-testid="products-page">
      <SEO
        title="Natural Stone Products | Sukabumi Green Stone, Pedra Bali — PT. Murfy Alam Indonesia"
        description="Export-grade Sukabumi Green Stone pool tiles, Pedra Hijau, pool coping, mesh mosaic, black lava stone and andesite — cut to order and shipped worldwide from Indonesia."
        keywords="sukabumi green stone tiles, pedra bali products, green stone pool coping, bali stone mosaic, black lava stone, andesite"
        path="/products"
      />

      <section className="border-b border-line bg-surface">
        <div className="container-x pb-16 pt-44">
          <Reveal>
            <SectionTag num="—" label="PRODUCT CATALOGUE" />
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              Export-Grade Natural Stone
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">
              Every product is quarried, cut and graded in our Sukabumi facility, then packed to survive any voyage.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-24">
        {isLoading ? (
          <div className="py-20 text-center text-ash">Loading products…</div>
        ) : (
          <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {(products || []).map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.08}>
                <Link to={`/products/${p.slug}`} data-testid={`product-card-${p.slug}`} className="group block">
                  <div className="relative overflow-hidden">
                    <img
                      src={p.image}
                      alt={`${p.name} — export grade natural stone from Indonesia`}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute left-4 top-4 bg-ink/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brass backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4 border-t border-line pt-5">
                    <div>
                      <h2 className="font-serif text-2xl text-bone transition-colors duration-300 group-hover:text-brass">{p.name}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-ash">{p.short_desc}</p>
                    </div>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-brass transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
