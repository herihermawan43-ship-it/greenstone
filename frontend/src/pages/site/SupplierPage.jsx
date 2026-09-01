import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Ship, FileCheck, Package, Anchor, CheckCircle2, Award, Leaf, Clock, Zap } from "lucide-react";
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

      {/* 01 HERO */}
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
            {c.market_context && (
              <div className="mt-8 border-t border-line pt-8 max-w-2xl">
                <p className="text-sm leading-relaxed text-ash italic">{c.market_context}</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* 02 MARKET SNAPSHOT */}
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

      {/* 03 FACTORY-DIRECT ADVANTAGE */}
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

      {/* 04 PRODUCT SHOWCASE */}
      <section className="container-x py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <SectionTag num="03" label="PRODUCTS FOR THIS APPLICATION" />
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
                {p.finishes && p.finishes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.finishes.slice(0, 2).map((f) => (
                      <span key={f} className="inline-block bg-surface px-2 py-1 text-[10px] text-brass">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 05 SPECIFICATIONS & QUALITY */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="04" label="QUALITY & SPECIFICATIONS" />
            <h2 className="mt-6 max-w-3xl font-serif text-3xl text-bone">Export-Grade Standards</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              { icon: CheckCircle2, title: "Calibration Tolerance", desc: "All pieces measured to ±1mm — consistent across every container shipped to " + cn.name },
              { icon: Award, title: "Piece-by-Piece Grading", desc: "Each tile hand-graded for colour, finish and structural integrity before packing" },
              { icon: Zap, title: "Lab Tested", desc: "Compression, absorption and freeze-thaw testing per international stone standards" },
              { icon: FileCheck, title: "Documentation", desc: "Pallet-level QC reports, certificates of origin and full traceability included" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="border-t border-brass/40 pt-6">
                  <Icon className="h-6 w-6 text-brass" />
                  <h3 className="mt-4 font-serif text-lg text-bone">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 06 SHIPPING & LOGISTICS TIMELINE */}
      <section className="container-x py-24">
        <Reveal>
          <SectionTag num="05" label="LOGISTICS TIMELINE" />
          <h2 className="mt-6 font-serif text-3xl text-bone">From Quarry to {cn.name}</h2>
        </Reveal>
        <div className="mt-12 space-y-0">
          {[
            { week: "Week 1", title: "Quote & Confirmation", desc: "Send your requirements. Receive detailed quotation with delivery timeline within 24 hours." },
            { week: "Week 2–3", title: "Production Underway", desc: "Blocks sourced, cut to specification, calibrated and graded at our Sukabumi facility." },
            { week: "Week 4", title: "QC & Export Packing", desc: "Final inspection, ISPM-15 fumigation, documentation prepared, container loading." },
            { week: `+${c.logistics.transit}`, title: "Ocean Transit to " + c.logistics.destination, desc: "Professional container management, full tracking. Documents couriered ahead of arrival." },
          ].map((s, i) => (
            <Reveal key={s.week} delay={i * 0.05}>
              <div className="grid gap-4 border-b border-line py-8 sm:grid-cols-12">
                <span className="font-mono text-sm text-brass sm:col-span-2">{s.week}</span>
                <h3 className="font-serif text-lg text-bone sm:col-span-4">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ash sm:col-span-6">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 07 EXPORT PROCESS */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="06" label="HOW ORDERING WORKS" />
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

      {/* 08 SUSTAINABILITY */}
      <section className="container-x py-24">
        <Reveal>
          <SectionTag num="07" label="ENVIRONMENTAL RESPONSIBILITY" />
          <h2 className="mt-6 max-w-2xl font-serif text-3xl text-bone">Sustainable Stone Sourcing</h2>
        </Reveal>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl text-bone">Quarry Management</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">Our Sukabumi quarry operates under environmental permits with waste rock recycling and habitat restoration protocols.</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-bone">Water Stewardship</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">Recycled water in production, sedimentation ponds, and zero-discharge systems minimize environmental impact.</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-bone">Certifications</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">ISPM-15 compliance, phytosanitary clearance, and export documentation meet international environmental standards.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="border border-line bg-surface p-8">
              <Leaf className="h-8 w-8 text-brass" />
              <h3 className="mt-4 font-serif text-2xl text-bone">Commitment to the Planet</h3>
              <p className="mt-4 text-sm leading-relaxed text-ash">
                Stone is timeless. Our commitment is to source, produce and deliver {kw.name.toLowerCase()} responsibly, minimizing carbon footprint and protecting local ecosystems for future generations.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 09 PRICING MODEL */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="08" label="PRICING TRANSPARENCY" />
            <h2 className="mt-6 font-serif text-3xl text-bone">How {kw.name} Pricing Works</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { term: "FOB", title: "Free on Board", desc: "Price covers production, packing, and delivery to Jakarta port. You arrange freight from Tanjung Priok." },
              { term: "CFR", title: "Cost & Freight", desc: "Price includes ocean freight to " + c.logistics.destination + ". You handle import customs and inland transport." },
              { term: "CIF", title: "Cost, Insur. & Freight", desc: "Full-service pricing — we handle production through delivery to your port, including insurance." },
            ].map(({ term, title, desc }, i) => (
              <Reveal key={term} delay={i * 0.08}>
                <div className="border border-line bg-ink p-6">
                  <span className="font-mono text-xs text-brass uppercase">{term}</span>
                  <h3 className="mt-3 font-serif text-lg text-bone">{title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-ash">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <p className="mt-8 max-w-3xl text-sm text-ash">
              Standard MOQ: <span className="text-bone font-semibold">1 × 20-ft container (~550–650 m²)</span> — trial shipments & LCL orders available. Request a detailed quotation with your specifications for {cn.name}.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 10 SOCIAL PROOF & RATINGS */}
      <section className="container-x py-24">
        <Reveal>
          <SectionTag num="09" label="TRUSTED BY IMPORTERS WORLDWIDE" />
        </Reveal>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            { stat: "20+", label: "Years Exporting" },
            { stat: "180+", label: "Countries Served" },
            { stat: "<1%", label: "Defect Rate" },
          ].map(({ stat, label }, i) => (
            <Reveal key={label} delay={i * 0.1}>
              <div className="border border-line bg-surface p-8 text-center">
                <div className="font-serif text-4xl font-semibold text-brass">{stat}</div>
                <p className="mt-2 text-sm text-ash">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.4}>
          <div className="mt-12 border-t border-line pt-8">
            <p className="max-w-3xl text-sm leading-relaxed text-ash italic">
              "PT. Murfy Alam Indonesia is the only factory-direct supplier we trust for consistent grading and on-time delivery. Working directly with them cuts out middlemen and confusion."
            </p>
            <p className="mt-3 text-xs text-brass font-semibold">— Importer, {cn.name}</p>
          </div>
        </Reveal>
      </section>

      {/* 11 DETAILED FAQ */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <SectionTag num="10" label={`FAQ — ${kw.name.toUpperCase()} IN ${cn.name.toUpperCase()}`} />
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
        </div>
      </section>

      {/* 12 RELATED KEYWORDS */}
      <section className="container-x py-24">
        <Reveal>
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionTag num="11" label="EXPLORE MORE STONE TYPES" />
              <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ash">Other options for {cn.name}</h3>
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
            </div>
          </div>
        </Reveal>
      </section>

      {/* 13 CTA & CONTACT */}
      <section className="border-t border-line bg-surface">
        <div className="container-x py-24">
          <Reveal>
            <div className="grid gap-16 lg:grid-cols-12">
              <div className="lg:col-span-7">
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
              </div>
              <Reveal delay={0.1} className="lg:col-span-5">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif text-lg text-bone">Direct Contact</h3>
                    <p className="mt-2 text-sm text-ash">
                      <a href="mailto:giat@zeofa.com" className="text-brass hover:text-bone transition-colors">giat@zeofa.com</a>
                    </p>
                    <p className="text-sm text-ash">
                      <a href="https://wa.me/6285141567350" className="text-brass hover:text-bone transition-colors">WhatsApp: +62 851-4156-7350</a>
                    </p>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-bone">Operating Hours</h3>
                    <p className="mt-2 text-sm text-ash">Monday – Friday, 8:00 AM – 5:00 PM WIB</p>
                    <p className="text-xs text-muted-foreground mt-1">Replies within 24 hours</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
