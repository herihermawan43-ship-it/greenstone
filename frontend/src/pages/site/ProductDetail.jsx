import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";

function SpecList({ title, items, testid }) {
  if (!items || items.length === 0) return null;
  return (
    <div data-testid={testid} className="border-t border-line py-7">
      <h3 className="text-xs uppercase tracking-[0.25em] text-brass">{title}</h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((it, i) => (
          <li key={i} className="border border-line px-3 py-1.5 text-xs text-ash">{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data,
    retry: false,
  });
  const { data: contactPage } = useQuery({
    queryKey: ["page", "contact"],
    queryFn: async () => (await api.get("/pages/contact")).data,
  });
  const { data: all } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="animate-pulse font-serif text-3xl text-ash">Murfy Alam</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-x flex min-h-screen flex-col items-start justify-center" data-testid="product-not-found">
        <h1 className="font-serif text-5xl text-bone">Product not found</h1>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 text-sm text-brass hover:underline" data-testid="back-to-products">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>
      </div>
    );
  }

  const waNumber = String(contactPage?.content?.info?.whatsapp || "6281234567890").replace(/\D/g, "");
  const wa = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello, I would like a quotation for ${product.name}.`)}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_desc || product.description,
    image: product.image,
    category: product.category,
    brand: { "@type": "Brand", name: "PT. Murfy Alam Indonesia" },
    offers: { "@type": "Offer", availability: "https://schema.org/InStock", priceCurrency: "USD", url: `${process.env.REACT_APP_BACKEND_URL}/products/${product.slug}` },
  };

  const related = (all || []).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <main data-testid="product-detail-page">
      <SEO
        title={product.seo_title || `${product.name} | PT. Murfy Alam Indonesia`}
        description={product.seo_desc || product.short_desc}
        image={product.image}
        path={`/products/${product.slug}`}
        type="product"
        jsonLd={productJsonLd}
      />

      <section className="container-x pb-16 pt-40">
        <Reveal>
          <Link to="/products" data-testid="back-to-products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:text-brass">
            <ArrowLeft className="h-4 w-4" /> All Products
          </Link>
        </Reveal>
        <div className="mt-10 grid gap-14 lg:grid-cols-2">
          <Reveal y={40}>
            <div className="overflow-hidden">
              <img
                src={product.image}
                alt={`${product.name} — Sukabumi natural stone, export quality`}
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                data-testid="product-main-image"
              />
            </div>
            {product.gallery?.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-4" data-testid="product-gallery">
                {product.gallery.slice(0, 3).map((g, i) => (
                  <img key={i} src={g} alt={`${product.name} detail view ${i + 1}`} className="aspect-square w-full object-cover" />
                ))}
              </div>
            )}
          </Reveal>
          <div>
            <Reveal>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-brass" data-testid="product-category">{product.category}</span>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-bone sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ash" data-testid="product-description">{product.description}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8">
                <SpecList title="Available Finishes" items={product.finishes} testid="product-finishes" />
                <SpecList title="Standard Sizes" items={product.sizes} testid="product-sizes" />
                <SpecList title="Applications" items={product.applications} testid="product-applications" />
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="product-whatsapp-btn"
                  className="inline-flex items-center gap-2 bg-moss px-7 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight"
                >
                  <MessageCircle className="h-4 w-4" /> Quote via WhatsApp
                </a>
                <Link
                  to="/contact"
                  data-testid="product-inquiry-btn"
                  className="inline-flex items-center gap-2 border border-bone/25 px-7 py-4 text-xs uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-brass hover:text-brass"
                >
                  Send Inquiry <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface py-24" data-testid="related-products">
          <div className="container-x">
            <h2 className="font-serif text-3xl text-bone sm:text-4xl">Related Stone Products</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} to={`/products/${p.slug}`} data-testid={`related-${p.slug}`} className="group block">
                  <div className="overflow-hidden">
                    <img src={p.image} alt={`${p.name} natural stone`} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <h3 className="mt-4 font-serif text-xl text-bone transition-colors group-hover:text-brass">{p.name}</h3>
                  <p className="mt-1 text-sm text-ash">{p.short_desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
