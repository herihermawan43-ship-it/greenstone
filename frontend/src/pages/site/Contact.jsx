import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from "lucide-react";
import { api, apiError } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const EMPTY = { name: "", email: "", company: "", country: "", product: "", message: "" };

export default function Contact() {
  const { data: page } = useQuery({
    queryKey: ["page", "contact"],
    queryFn: async () => (await api.get("/pages/contact")).data,
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="animate-pulse font-serif text-3xl text-ash">Murfy Alam</span>
      </div>
    );
  }

  const c = page.content;
  const wa = `https://wa.me/${String(c.info.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hello PT. Murfy Alam Indonesia, I would like a quotation for Sukabumi Green Stone."
  )}`;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/inquiries", form);
      toast.success("Inquiry sent. Our export team will reply within 24 hours.");
      setForm(EMPTY);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full border-b border-line bg-transparent py-3 text-sm text-bone placeholder:text-ash/50 outline-none transition-colors duration-300 focus:border-brass";

  return (
    <main data-testid="contact-page">
      <SEO
        title={c.seo.title}
        description={c.seo.description}
        keywords={c.seo.keywords}
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: c.seo.title,
          description: c.seo.description,
        }}
      />

      <section data-testid="contact-hero" className="border-b border-line bg-surface">
        <div className="container-x pb-16 pt-44">
          <Reveal>
            <p className="overline-tag mb-6">{c.hero.overline}</p>
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-bone sm:text-6xl lg:text-7xl">
              {c.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">{c.hero.body}</p>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-24">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 className="font-serif text-3xl text-bone">Head Office &amp; Factory</h2>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4" data-testid="contact-address">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-brass" />
                  <p className="text-sm leading-relaxed text-ash">{c.info.address}</p>
                </div>
                <div className="flex gap-4" data-testid="contact-phone">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-brass" />
                  <a href={`tel:${c.info.phone.replace(/\s/g, "")}`} className="text-sm text-ash transition-colors hover:text-bone">{c.info.phone}</a>
                </div>
                <div className="flex gap-4" data-testid="contact-email">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-brass" />
                  <a href={`mailto:${c.info.email}`} className="text-sm text-ash transition-colors hover:text-bone">{c.info.email}</a>
                </div>
                <div className="flex gap-4" data-testid="contact-hours">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-brass" />
                  <p className="text-sm text-ash">{c.info.hours}</p>
                </div>
              </div>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-whatsapp-btn"
                className="mt-10 inline-flex items-center gap-2 bg-moss px-7 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-16">
                <h3 className="font-serif text-2xl text-bone">{c.faq.title}</h3>
                <Accordion type="single" collapsible className="mt-4" data-testid="contact-faq">
                  {c.faq.items.map((f, i) => (
                    <AccordionItem key={i} value={`cf-${i}`} className="border-line">
                      <AccordionTrigger data-testid={`contact-faq-trigger-${i}`} className="text-left text-sm text-bone hover:text-brass hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-ash">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Reveal>
          </div>

          <Reveal className="lg:col-span-7" delay={0.1}>
            <div className="border border-line bg-surface p-8 sm:p-12">
              <h2 className="font-serif text-3xl text-bone">{c.form.title}</h2>
              <p className="mt-3 text-sm text-ash">{c.form.text}</p>
              <form onSubmit={submit} className="mt-10 grid gap-8 sm:grid-cols-2" data-testid="inquiry-form">
                <div>
                  <label htmlFor="inq-name" className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-ash">Full Name *</label>
                  <input id="inq-name" data-testid="inquiry-name-input" required value={form.name} onChange={set("name")} className={inputCls} placeholder="Jane Cooper" />
                </div>
                <div>
                  <label htmlFor="inq-email" className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-ash">Business Email *</label>
                  <input id="inq-email" data-testid="inquiry-email-input" required type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="jane@company.com" />
                </div>
                <div>
                  <label htmlFor="inq-company" className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-ash">Company</label>
                  <input id="inq-company" data-testid="inquiry-company-input" value={form.company} onChange={set("company")} className={inputCls} placeholder="Cooper Resorts Ltd." />
                </div>
                <div>
                  <label htmlFor="inq-country" className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-ash">Country</label>
                  <input id="inq-country" data-testid="inquiry-country-input" value={form.country} onChange={set("country")} className={inputCls} placeholder="United Arab Emirates" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="inq-product" className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-ash">Product of Interest</label>
                  <select
                    id="inq-product"
                    data-testid="inquiry-product-select"
                    value={form.product}
                    onChange={set("product")}
                    className={`${inputCls} bg-ink`}
                  >
                    <option value="">General inquiry</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="inq-message" className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-ash">Project Details *</label>
                  <textarea id="inq-message" data-testid="inquiry-message-input" required rows={5} value={form.message} onChange={set("message")} className={`${inputCls} resize-none`} placeholder="Quantities, sizes, destination port, timeline…" />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={sending}
                    data-testid="inquiry-submit-btn"
                    className="group inline-flex items-center gap-2 bg-moss px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send Inquiry"}
                    <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
