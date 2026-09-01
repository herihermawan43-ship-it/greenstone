import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { SectionTag } from "@/components/site/SectionTag";

export default function About() {
  const { data: page, isLoading } = useQuery({
    queryKey: ["page", "about"],
    queryFn: async () => (await api.get("/pages/about")).data,
  });

  if (isLoading || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="animate-pulse font-serif text-3xl text-ash">Murfy Alam</span>
      </div>
    );
  }

  const c = page.content;

  return (
    <main data-testid="about-page">
      <SEO title={c.seo.title} description={c.seo.description} keywords={c.seo.keywords} image={c.hero.image} path="/about" />

      <section data-testid="about-hero" className="relative flex min-h-[70vh] items-end overflow-hidden">
        <img src={c.hero.image} alt="Sukabumi green stone quarry and factory in West Java, Indonesia" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <div className="container-x relative z-10 pb-20 pt-48">
          <Reveal>
            <p className="overline-tag mb-6">{c.hero.overline}</p>
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              {c.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-bone/70 sm:text-lg">{c.hero.body}</p>
          </Reveal>
        </div>
      </section>

      <section data-testid="about-story" className="container-x py-28">
        <div className="grid items-start gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionTag num={c.story.chapter} label="WHO WE ARE" />
              <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">{c.story.title}</h2>
            </Reveal>
            <Reveal delay={0.15}>
              {c.story.paragraphs.map((p, i) => (
                <p key={i} className="mt-6 max-w-2xl text-base leading-relaxed text-ash">{p}</p>
              ))}
            </Reveal>
          </div>
          <Reveal className="lg:col-span-5" delay={0.2} y={40}>
            <div className="relative ml-auto aspect-[3/4] w-full max-w-md overflow-hidden">
              <img src={c.story.image} alt="Sukabumi green stone surface texture detail" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 border border-bone/10" />
            </div>
          </Reveal>
        </div>
      </section>

      <section data-testid="about-values" className="border-y border-line bg-raised/30 py-28">
        <div className="container-x">
          <Reveal>
            <SectionTag num={c.values.chapter} label="OUR PRINCIPLES" />
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">{c.values.title}</h2>
          </Reveal>
          <div className="mt-14 grid gap-px bg-line md:grid-cols-3">
            {c.values.items.map((v, i) => (
              <Reveal key={i} delay={i * 0.1} className="bg-ink">
                <div data-testid={`about-value-${i}`} className="h-full p-9 transition-colors duration-500 hover:bg-raised/60">
                  <span className="font-mono text-xs text-brass">0{i + 1}</span>
                  <h3 className="mt-5 font-serif text-2xl text-bone">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ash">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section data-testid="about-stats" className="container-x py-24">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {c.stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div data-testid={`about-stat-${i}`} className="border-t border-line pt-6">
                <div className="font-serif text-5xl font-semibold text-brass">{s.value}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-ash">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section data-testid="about-quarry" className="bg-surface py-28">
        <div className="container-x grid items-center gap-16 lg:grid-cols-2">
          <Reveal y={40}>
            <div className="overflow-hidden">
              <img src={c.quarry.image} alt="Green marbled Sukabumi stone from the West Java quarry" className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <SectionTag num={c.quarry.chapter} label="THE SOURCE" />
              <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">{c.quarry.title}</h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ash">{c.quarry.body}</p>
            </Reveal>
            <ul className="mt-8 space-y-4">
              {c.quarry.bullets.map((b, i) => (
                <Reveal key={i} delay={0.1 + i * 0.06}>
                  <li data-testid={`quarry-bullet-${i}`} className="flex items-start gap-3 text-sm text-bone/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                    {b}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section data-testid="about-certifications" className="container-x py-28">
        <Reveal>
          <SectionTag num={c.certifications.chapter} label="TRUST & COMPLIANCE" />
          <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-bone sm:text-5xl">{c.certifications.title}</h2>
        </Reveal>
        <div className="mt-14 grid gap-px bg-line md:grid-cols-3">
          {c.certifications.items.map((item, i) => (
            <Reveal key={i} delay={i * 0.1} className="bg-ink">
              <div data-testid={`certification-${i}`} className="h-full p-9">
                <h3 className="font-serif text-2xl text-bone">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ash">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section data-testid="about-cta" className="container-x pb-28">
        <Reveal>
          <div className="bg-moss px-8 py-16 sm:px-16">
            <h2 className="max-w-2xl font-serif text-4xl font-medium leading-tight text-white sm:text-5xl">{c.cta.title}</h2>
            <p className="mt-5 max-w-xl text-base text-white/75">{c.cta.text}</p>
            <Link to="/contact" data-testid="about-cta-btn" className="group mt-8 inline-flex items-center gap-2 bg-ink px-7 py-4 text-xs uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:bg-raised">
              {c.cta.button}
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
