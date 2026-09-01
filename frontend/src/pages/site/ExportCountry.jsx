import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Ship, FileCheck, Package, Anchor } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import NotFound from "@/pages/NotFound";

export default function ExportCountry() {
  const { slug } = useParams();
  const { data: country, isLoading, isError } = useQuery({
    queryKey: ["country", slug],
    queryFn: async () => (await api.get(`/countries/${slug}`)).data,
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  if (isLoading) return <main className="pt-44 pb-32 text-center text-ash">Loading…</main>;
  if (isError || !country) return <NotFound />;

  const c = country.content;
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
        name: `Natural Stone Export to ${country.name}`,
        provider: { "@type": "Organization", name: "PT. Murfy Alam Indonesia" },
        areaServed: country.name,
        serviceType: "Natural stone supply and export",
      },
    ],
  };

  return (
    <main data-testid="export-country-page">
      <SEO
        title={c.seo.title}
        description={c.seo.description}
        keywords={c.seo.keywords}
        path={`/export/${country.slug}`}
        jsonLd={jsonLd}
      />

      {/* 01 Hero */}
      <section className="border-b border-line bg-surface">
        <div className="container-x pb-16 pt-44">
          <Reveal>
            <nav className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ash" data-testid="export-breadcrumb">
              <Link to="/export" className="transition-colors hover:text-brass">Export Markets</Link>
              <span className="text-brass">/</span>
              <span className="text-bone">{country.name}</span>
            </nav>
            <SectionTag num="—" label={c.hero.overline} />
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              {c.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">{c.hero.body}</p>
          </Reveal>
        </div>
      </section>

      {/* 02 Intro */}
      <section className="container-x py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <SectionTag num="01" label={`SUPPLYING ${country.name.toUpperCase()}`} />
            {c.intro.map((p, i) => (
              <p key={i} className="mb-5 max-w-2xl text-base leading-relaxed text-ash sm:text-lg">{p}</p>
            ))}
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="border border-line bg-surface p-8" data-testid="export-logistics-card">
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
            <SectionTag num="02" label="WHY BUY FACTORY-DIRECT" />
          </Reveal>
          <div className="mt-4 grid gap-px bg-line sm:grid-cols-2">
            {c.benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.08}>
                <div className="h-full bg-surface p-8" data-testid={`export-benefit-${i}`}>
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
            <SectionTag num="03" label={`STONE FOR ${country.name.toUpperCase()}`} />
            <Link to="/products" data-testid="export-all-products-link" className="mb-10 hidden items-center gap-1 text-sm text-brass transition-colors hover:text-bone sm:flex">
              Full catalogue <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-3">
          {(products || []).slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link to={`/products/${p.slug}`} data-testid={`export-product-${p.slug}`} className="group block">
                <div className="overflow-hidden">
                  <img src={p.image} alt={`${p.name} for export to ${country.name}`} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="mt-4 font-serif text-xl text-bone transition-colors group-hover:text-brass">{p.name}</h3>
                <p className="mt-2 text-sm text-ash">{p.short_desc}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 05 Applications */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="04" label="APPLICATIONS" />
          </Reveal>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {c.applications.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.08}>
                <div className="border-t border-brass/40 pt-5">
                  <h3 className="font-serif text-lg text-bone">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06 Process */}
      <section className="container-x py-24">
        <Reveal>
          <SectionTag num="05" label="FROM SUKABUMI TO YOUR PORT" />
        </Reveal>
        <div className="space-y-0">
          {c.process.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.05}>
              <div className="grid gap-4 border-b border-line py-8 sm:grid-cols-12" data-testid={`export-process-${s.step}`}>
                <span className="font-mono text-sm text-brass sm:col-span-1">{s.step}</span>
                <h3 className="font-serif text-xl text-bone sm:col-span-4">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ash sm:col-span-7">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 07 FAQ */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="06" label={`FAQ — ${country.name.toUpperCase()}`} />
          </Reveal>
          <Accordion type="single" collapsible className="max-w-3xl">
            {c.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-line">
                <AccordionTrigger data-testid={`export-faq-trigger-${i}`} className="text-left font-serif text-lg text-bone hover:text-brass hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-ash">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 08 Related + CTA */}
      <section className="container-x py-24">
        <div className="grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionTag num="07" label="NEARBY MARKETS" />
            <ul className="space-y-1">
              {country.related.map((r) => (
                <li key={r.slug}>
                  <Link to={`/export/${r.slug}`} data-testid={`export-related-${r.slug}`} className="group flex items-center justify-between border-b border-line py-3 text-sm text-ash transition-colors hover:text-bone">
                    {r.name}
                    <ArrowUpRight className="h-4 w-4 text-brass opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="flex h-full flex-col justify-center border border-line bg-surface p-10">
              <h2 className="font-serif text-3xl font-semibold leading-tight text-bone sm:text-4xl">{c.cta.title}</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ash">{c.cta.text}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/contact" data-testid="export-cta-quote" className="inline-flex items-center gap-2 bg-brass px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-bone">
                  Get a Quote <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a
                  data-testid="export-cta-whatsapp"
                  href={`https://wa.me/6285141567350?text=${encodeURIComponent(`Hello PT. Murfy Alam Indonesia, I would like a quotation for Sukabumi Green Stone delivered to ${country.name}.`)}`}
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
      </section>
    </main>
  );
}
