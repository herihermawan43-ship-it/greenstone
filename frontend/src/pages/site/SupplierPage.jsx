import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Ship, FileCheck, Package, Anchor } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import NotFound from "@/pages/NotFound";

export default function SupplierPage() {
  const { keyword, country } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["supplier", keyword, country],
    queryFn: async () => (await api.get(`/supplier/${keyword}/${country}`)).data,
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  if (isLoading) return <main className="pt-44 pb-32 text-center text-ash">Loading…</main>;
  if (isError || !data) return <NotFound />;

  const c = data.content;
  const kw = data.keyword;
  const cn = data.country;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: c.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "Service",
        name: `${kw.name} Supply to ${cn.name}`,
        provider: { "@type": "Organization", name: "PT. Murfy Alam Indonesia" },
        areaServed: cn.name,
        serviceType: `${kw.name} supply and export`,
      },
    ],
  };

  return (
    <main data-testid="supplier-page">
      <SEO
        title={c.seo.title}
        description={c.seo.description}
        keywords={c.seo.keywords}
        path={`/supplier/${kw.slug}/${cn.slug}`}
        jsonLd={jsonLd}
      />

      {/* 01 Hero */}
      <section className="border-b border-line bg-surface">
        <div className="container-x pb-16 pt-44">
          <Reveal>
            <nav className="mb-8 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash" data-testid="supplier-breadcrumb">
              <Link to="/export" className="transition-colors hover:text-brass">Export Markets</Link>
              <span className="text-brass">/</span>
              <Link to={`/export/${cn.slug}`} className="transition-colors hover:text-brass">{cn.name}</Link>
              <span className="text-brass">/</span>
              <span className="text-bone">{kw.name}</span>
            </nav>
            <SectionTag num="—" label={c.hero.overline} />
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              {c.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">{c.hero.body}</p>
          </Reveal>
        </div>
      </section>

      {/* 02 Intro + snapshot */}
      <section className="container-x py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <SectionTag num="01" label={`${kw.name.toUpperCase()} FOR ${cn.name.toUpperCase()}`} />
            {c.intro.map((p, i) => (
              <p key={i} className="mb-5 max-w-2xl text-base leading-relaxed text-ash sm:text-lg">{p}</p>
            ))}
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="border border-line bg-surface p-8" data-testid="supplier-logistics-card">
              <h2 className="font-serif text-2xl text-bone">Shipping Snapshot</h2>
              <dl className="mt-6 space-y-5 text-sm">
                {[
                  [Anchor, "Origin", c.logistics.origin],
                  [Ship, "Destination", c.logistics.destination],
                  [Package, "Ocean Transit", c.logistics.transit],
                  [FileCheck, "Terms", c.logistics.terms],
                ].map(([Icon, k, v]) => (
                  <div key={k} className="flex items-start gap-4 border-b border-line pb-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{k}</dt>
                      <dd className="mt-1 text-bone">{v}</dd>
                    </div>
                  </div>
                ))}
                <p className="text-xs leading-relaxed text-ash">{c.logistics.packing}</p>
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 03 Benefits */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="02" label="WHY BUY FROM THE FACTORY" />
          </Reveal>
          <div className="mt-4 grid gap-px bg-line sm:grid-cols-2">
            {c.benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.08}>
                <div className="h-full bg-surface p-8" data-testid={`supplier-benefit-${i}`}>
                  <span className="font-mono text-xs text-brass">0{i + 1}</span>
                  <h3 className="mt-3 font-serif text-xl text-bone">{b.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ash">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 04 Products */}
      <section className="container-x py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <SectionTag num="03" label="RELATED PRODUCTS" />
            <Link to="/products" data-testid="supplier-all-products-link" className="mb-10 hidden items-center gap-1 text-sm text-brass transition-colors hover:text-bone sm:flex">
              Full catalogue <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-3">
          {(products || []).slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link to={`/products/${p.slug}`} data-testid={`supplier-product-${p.slug}`} className="group block">
                <div className="overflow-hidden">
                  <img src={p.image} alt={`${p.name} — ${kw.name} export to ${cn.name}`} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="mt-4 font-serif text-xl text-bone transition-colors group-hover:text-brass">{p.name}</h3>
                <p className="mt-2 text-sm text-ash">{p.short_desc}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 05 Process */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="04" label="HOW ORDERING WORKS" />
          </Reveal>
          <div className="space-y-0">
            {c.process.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.05}>
                <div className="grid gap-4 border-b border-line py-8 sm:grid-cols-12" data-testid={`supplier-process-${s.step}`}>
                  <span className="font-mono text-sm text-brass sm:col-span-1">{s.step}</span>
                  <h3 className="font-serif text-xl text-bone sm:col-span-4">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-ash sm:col-span-7">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06 FAQ */}
      <section className="container-x py-24">
        <Reveal>
          <SectionTag num="05" label={`FAQ — ${kw.name.toUpperCase()} IN ${cn.name.toUpperCase()}`} />
        </Reveal>
        <Accordion type="single" collapsible className="max-w-3xl">
          {c.faq.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-line">
              <AccordionTrigger data-testid={`supplier-faq-trigger-${i}`} className="text-left font-serif text-lg text-bone hover:text-brass hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-ash">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 07 Related + CTA */}
      <section className="border-t border-line bg-surface">
        <div className="container-x py-24">
          <div className="grid gap-16 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <SectionTag num="06" label="EXPLORE MORE" />
              <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ash">Other stone for {cn.name}</h3>
              <ul className="space-y-1">
                {(data.other_keywords || []).slice(0, 5).map((k) => (
                  <li key={k.slug}>
                    <Link to={`/supplier/${k.slug}/${cn.slug}`} data-testid={`supplier-other-${k.slug}`} className="group flex items-center justify-between border-b border-line py-3 text-sm text-ash transition-colors hover:text-bone">
                      {k.name} in {cn.name}
                      <ArrowUpRight className="h-4 w-4 text-brass opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to={`/export/${cn.slug}`} data-testid="supplier-country-link" className="group flex items-center justify-between border-b border-line py-3 text-sm text-brass transition-colors hover:text-bone">
                    All exports to {cn.name}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </li>
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7">
              <div className="flex h-full flex-col justify-center border border-line bg-ink p-10">
                <h2 className="font-serif text-3xl font-semibold leading-tight text-bone sm:text-4xl">{c.cta.title}</h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-ash">{c.cta.text}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link to="/contact" data-testid="supplier-cta-quote" className="inline-flex items-center gap-2 bg-brass px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-bone">
                    Get a Quote <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <a
                    data-testid="supplier-cta-whatsapp"
                    href={`https://wa.me/6285141567350?text=${encodeURIComponent(`Hello PT. Murfy Alam Indonesia, I would like a quotation for ${kw.name} delivered to ${cn.name}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-line px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-brass hover:text-brass"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
