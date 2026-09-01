import { useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import { ArrowUpRight, ArrowRight, ArrowDown, Ship, ShieldCheck, Ruler } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const VALUE_ICONS = [Ship, ShieldCheck, Ruler];

const MaskedLine = ({ children, delay = 0, className = "" }) => (
  <span className="block overflow-hidden pb-1">
    <motion.span
      className={`block ${className}`}
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  </span>
);

function Hero({ data }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <section ref={ref} data-testid="hero-section" className="relative flex min-h-screen items-end overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={data.image}
          alt="Sukabumi green stone infinity pool at a luxury tropical resort"
          className="h-[120%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      </motion.div>

      <motion.div style={{ opacity }} className="container-x relative z-10 pb-24 pt-40">
        <motion.p
          className="overline-tag mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {data.overline}
        </motion.p>
        <h1 className="font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          <MaskedLine delay={0.35} className="text-bone">{data.line1}</MaskedLine>
          <MaskedLine delay={0.5} className="italic text-brass">{data.line2}</MaskedLine>
          <MaskedLine delay={0.65} className="text-bone">{data.line3}</MaskedLine>
        </h1>
        <motion.p
          className="mt-8 max-w-xl text-base leading-relaxed text-bone/70 sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
        >
          {data.subheading}
        </motion.p>
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05 }}
        >
          <Link
            to="/contact"
            data-testid="hero-cta-primary"
            className="group flex items-center gap-2 bg-moss px-7 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight"
          >
            {data.cta_primary}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            to="/products"
            data-testid="hero-cta-secondary"
            className="group flex items-center gap-2 border border-bone/25 px-7 py-4 text-xs uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-brass hover:text-brass"
          >
            {data.cta_secondary}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 right-8 z-10 hidden items-center gap-3 text-ash lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
      </motion.div>
    </section>
  );
}

function EditorialMarquee({ items }) {
  return (
    <section data-testid="marquee-section" className="border-y border-line/60 bg-surface py-6">
      <Marquee speed={35} gradient={false} pauseOnHover>
        {items.map((item, i) => (
          <span key={i} className="mx-8 flex items-center gap-8">
            <span className="font-serif text-xl italic tracking-wide text-bone/80 sm:text-2xl">{item}</span>
            <span className="h-1.5 w-1.5 rotate-45 bg-brass/70" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

function Manifesto({ data }) {
  return (
    <section data-testid="manifesto-section" className="container-x py-28 lg:py-36">
      <div className="grid items-start gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <SectionTag num={data.chapter} label={data.overline} />
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl lg:text-6xl">
              {data.title}
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-ash">{data.body1}</p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ash">{data.body2}</p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-10">
              {data.stats.map((s, i) => (
                <div key={i} data-testid={`manifesto-stat-${i}`}>
                  <div className="font-serif text-4xl font-semibold text-brass sm:text-5xl">{s.value}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-ash">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-5" delay={0.2} y={40}>
          <div className="relative ml-auto aspect-[3/4] w-full max-w-md overflow-hidden">
            <img
              src={data.image}
              alt="Raw Sukabumi green stone blocks selected for export"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 border border-bone/10" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Spotlight({ data }) {
  return (
    <section data-testid="spotlight-section" className="bg-surface py-28 lg:py-36">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2">
        <Reveal y={40}>
          <div className="relative overflow-hidden">
            <img
              src={data.image}
              alt="Close-up texture of Sukabumi green stone tiles with natural mineral veins"
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 bg-ink/80 px-5 py-3 backdrop-blur-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass">Pedra Bali · West Java</span>
            </div>
          </div>
        </Reveal>
        <div>
          <Reveal>
            <SectionTag num={data.chapter} label={data.overline} />
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              {data.title}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ash">{data.body}</p>
          </Reveal>
          <div className="mt-12 space-y-0">
            {data.features.map((f, i) => (
              <Reveal key={i} delay={0.1 + i * 0.1}>
                <div data-testid={`spotlight-feature-${i}`} className="group border-t border-line py-6 transition-colors duration-300 last:border-b hover:bg-raised/40">
                  <div className="flex items-baseline gap-5">
                    <span className="font-mono text-xs text-brass">0{i + 1}</span>
                    <div>
                      <h3 className="font-serif text-2xl text-bone transition-colors duration-300 group-hover:text-brass">{f.title}</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-ash">{f.text}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Applications({ data }) {
  const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
  return (
    <section data-testid="applications-section" className="container-x py-28 lg:py-36">
      <Reveal>
        <SectionTag num={data.chapter} label={data.overline} />
        <h2 className="max-w-3xl font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl lg:text-6xl">
          {data.title}
        </h2>
      </Reveal>
      <div className="mt-16 grid gap-5 lg:grid-cols-12">
        {data.items.map((item, i) => (
          <Reveal key={i} delay={i * 0.08} className={`group ${spans[i % 4]}`}>
            <Link to="/products" data-testid={`application-card-${i}`} className="relative block h-72 overflow-hidden sm:h-80">
              <img
                src={item.image}
                alt={`Sukabumi green stone application — ${item.title}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent" />
              <div className="absolute bottom-0 left-0 p-7">
                <h3 className="font-serif text-2xl text-bone sm:text-3xl">{item.title}</h3>
                <p className="mt-2 max-w-sm text-sm text-bone/60">{item.text}</p>
              </div>
              <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center border border-bone/20 bg-ink/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                <ArrowUpRight className="h-4 w-4 text-brass" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Values({ data }) {
  return (
    <section data-testid="values-section" className="border-y border-line bg-raised/30 py-28">
      <div className="container-x">
        <Reveal>
          <SectionTag num={data.chapter} label={data.overline} />
          <h2 className="max-w-3xl font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
            {data.title}
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-px bg-line md:grid-cols-3">
          {data.items.map((item, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <Reveal key={i} delay={i * 0.1} className="bg-ink">
                <div data-testid={`value-card-${i}`} className="group h-full p-9 transition-colors duration-500 hover:bg-raised/60">
                  <Icon className="h-7 w-7 text-brass" strokeWidth={1.5} />
                  <h3 className="mt-6 font-serif text-2xl text-bone">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ash">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ParallaxDivider({ data }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);
  return (
    <section ref={ref} data-testid="parallax-divider" className="relative flex h-[70vh] items-center overflow-hidden">
      <motion.img
        src={data.image}
        alt="Raw texture of Sukabumi green volcanic stone"
        style={{ y }}
        className="absolute -top-[14%] left-0 h-[128%] w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="container-x relative z-10">
        <Reveal>
          <blockquote className="max-w-4xl font-serif text-3xl font-medium italic leading-snug text-bone sm:text-5xl">
            “{data.quote}”
          </blockquote>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-brass">{data.author}</p>
        </Reveal>
      </div>
    </section>
  );
}

function GlobalReach({ data }) {
  return (
    <section data-testid="global-reach-section" className="container-x py-28 lg:py-36">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <SectionTag num={data.chapter} label={data.overline} />
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              {data.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash">{data.body}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap gap-3">
              {data.regions.map((r, i) => (
                <span
                  key={i}
                  data-testid={`region-chip-${i}`}
                  className="border border-line px-4 py-2 text-xs uppercase tracking-[0.18em] text-ash transition-colors duration-300 hover:border-brass hover:text-brass"
                >
                  {r}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <div className="grid gap-px bg-line">
            {data.stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.1} className="bg-ink">
                <div data-testid={`global-stat-${i}`} className="flex items-baseline justify-between p-8">
                  <span className="font-serif text-5xl font-semibold text-brass">{s.value}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-ash">{s.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Process({ data }) {
  return (
    <section data-testid="process-section" className="bg-surface py-28 lg:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <SectionTag num={data.chapter} label={data.overline} />
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              {data.title}
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-8">
          {data.steps.map((step, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div data-testid={`process-step-${i}`} className="group grid grid-cols-[auto_1fr] gap-6 border-t border-line py-8 transition-colors duration-300 last:border-b hover:bg-raised/40 sm:gap-10">
                <span className="font-mono text-sm text-brass">{step.num}</span>
                <div>
                  <h3 className="font-serif text-2xl text-bone transition-colors duration-300 group-hover:text-brass sm:text-3xl">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ash">{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Projects({ data }) {
  return (
    <section data-testid="projects-section" className="py-28 lg:py-36">
      <div className="container-x">
        <Reveal>
          <SectionTag num={data.chapter} label={data.overline} />
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              {data.title}
            </h2>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ash">Drag / scroll →</span>
          </div>
        </Reveal>
      </div>
      <div className="mt-14 overflow-x-auto pb-6 [scrollbar-width:thin]">
        <div className="flex w-max gap-6 px-6 sm:px-10 lg:px-16">
          {data.items.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <figure data-testid={`project-card-${i}`} className="group w-[78vw] shrink-0 sm:w-[420px]">
                <div className="overflow-hidden">
                  <img
                    src={p.image}
                    alt={`${p.title} — Sukabumi green stone project in ${p.location}`}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="font-serif text-xl text-bone">{p.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">{p.location}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ data }) {
  return (
    <section data-testid="testimonials-section" className="border-t border-line bg-raised/30 py-28">
      <div className="container-x">
        <Reveal>
          <SectionTag num={data.chapter} label={data.overline} />
          <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
            {data.title}
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-px bg-line lg:grid-cols-3">
          {data.items.map((t, i) => (
            <Reveal key={i} delay={i * 0.1} className="bg-ink">
              <blockquote data-testid={`testimonial-${i}`} className="flex h-full flex-col justify-between p-9">
                <p className="font-serif text-xl italic leading-relaxed text-bone/90">“{t.quote}”</p>
                <footer className="mt-8 border-t border-line pt-5">
                  <div className="text-sm font-semibold text-bone">{t.name}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-brass">{t.role}</div>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ data }) {
  return (
    <section data-testid="faq-section" className="container-x py-28 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal>
            <SectionTag num={data.chapter} label={data.overline} />
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">
              {data.title}
            </h2>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-8" delay={0.1}>
          <Accordion type="single" collapsible data-testid="faq-accordion">
            {data.items.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-line">
                <AccordionTrigger data-testid={`faq-trigger-${i}`} className="text-left font-serif text-xl text-bone hover:text-brass hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl text-sm leading-relaxed text-ash">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta({ data }) {
  return (
    <section data-testid="cta-section" className="container-x pb-28 lg:pb-36">
      <Reveal>
        <div className="relative overflow-hidden bg-moss px-8 py-20 sm:px-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rotate-45 border border-bone/10" />
          <div className="absolute -bottom-24 -right-8 h-72 w-72 rotate-45 border border-bone/10" />
          <h2 className="max-w-3xl font-serif text-4xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
            {data.title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75">{data.text}</p>
          <Link
            to="/contact"
            data-testid="cta-quote-btn"
            className="group mt-10 inline-flex items-center gap-2 bg-ink px-8 py-4 text-xs uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:bg-raised"
          >
            {data.button}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  const { data: page, isLoading } = useQuery({
    queryKey: ["page", "home"],
    queryFn: async () => (await api.get("/pages/home")).data,
  });

  if (isLoading || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="animate-pulse font-serif text-3xl text-ash">Murfy Alam</span>
      </div>
    );
  }

  const c = page.content;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main data-testid="home-page">
      <SEO
        title={c.seo.title}
        description={c.seo.description}
        keywords={c.seo.keywords}
        image={c.hero.image}
        path="/"
        jsonLd={faqJsonLd}
      />
      <Hero data={c.hero} />
      <EditorialMarquee items={c.marquee} />
      <Manifesto data={c.manifesto} />
      <Spotlight data={c.spotlight} />
      <Applications data={c.applications} />
      <Values data={c.values} />
      <ParallaxDivider data={c.parallax} />
      <GlobalReach data={c.global} />
      <Process data={c.process} />
      <Projects data={c.projects} />
      <Testimonials data={c.testimonials} />
      <Faq data={c.faq} />
      <FinalCta data={c.cta} />
    </main>
  );
}
