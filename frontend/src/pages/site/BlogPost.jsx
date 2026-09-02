import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Reveal } from "@/components/site/Reveal";
import { breadcrumbJsonLd, absoluteUrl } from "@/lib/schema";

const isHtml = (s) => /<[a-z][\s\S]*>/i.test(s || "");

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => (await api.get(`/posts/${slug}`)).data,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="animate-pulse font-serif text-3xl text-ash">Murfy Alam</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-x flex min-h-screen flex-col items-start justify-center" data-testid="post-not-found">
        <h1 className="font-serif text-5xl text-bone">Article not found</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm text-brass hover:underline" data-testid="back-to-blog">
          <ArrowLeft className="h-4 w-4" /> Back to journal
        </Link>
      </div>
    );
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        image: absoluteUrl(post.image),
        datePublished: post.created_at,
        dateModified: post.updated_at || post.created_at,
        author: { "@type": "Organization", name: post.author },
        publisher: { "@type": "Organization", name: "PT. Murfy Alam Indonesia" },
      },
      breadcrumbJsonLd([
        { name: "Journal", path: "/blog" },
        { name: post.title },
      ]),
    ],
  };

  return (
    <main data-testid="blog-post-page">
      <SEO
        title={post.seo_title || `${post.title} | PT. Murfy Alam Indonesia`}
        description={post.seo_desc || post.excerpt}
        image={post.image}
        path={`/blog/${post.slug}`}
        type="article"
        jsonLd={articleJsonLd}
      />

      <article className="container-x max-w-4xl pb-28 pt-40">
        <Reveal>
          <Link to="/blog" data-testid="back-to-blog" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ash transition-colors hover:text-brass">
            <ArrowLeft className="h-4 w-4" /> Journal
          </Link>
          <div className="mt-10 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-brass">
            <span>{fmtDate(post.created_at)}</span>
            {post.tags?.map((t, i) => (
              <span key={i} className="border border-line px-3 py-1 text-ash">{t}</span>
            ))}
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight tracking-tight text-bone sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ash">{post.excerpt}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 overflow-hidden">
            <img src={post.image} alt={post.title} className="aspect-[16/9] w-full object-cover" data-testid="post-hero-image" />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          {isHtml(post.content) ? (
            <div
              className="prose prose-invert prose-stone mt-12 max-w-none"
              data-testid="post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="mt-12" data-testid="post-content">
              {post.content.split(/\n\s*\n/).map((para, i) => (
                <p key={i} className="mb-6 text-base leading-loose text-bone/80 first:font-serif first:text-xl first:leading-relaxed first:text-bone">
                  {para}
                </p>
              ))}
            </div>
          )}
          <footer className="mt-12 border-t border-line pt-8">
            <span className="text-xs uppercase tracking-[0.2em] text-ash">Written by {post.author}</span>
          </footer>
        </Reveal>
      </article>
    </main>
  );
}
