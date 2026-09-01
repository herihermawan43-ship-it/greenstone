import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-screen flex-col items-start justify-center" data-testid="not-found-page">
      <SEO title="Page Not Found | PT. Murfy Alam Indonesia" description="The page you are looking for does not exist." path="/404" />
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-brass">Error 404</span>
      <h1 className="mt-6 font-serif text-6xl font-semibold text-bone sm:text-7xl">Lost in the Quarry</h1>
      <p className="mt-6 max-w-md text-base text-ash">
        The page you are looking for has been cut, polished and shipped elsewhere.
      </p>
      <Link
        to="/"
        data-testid="not-found-home-btn"
        className="mt-10 inline-flex items-center gap-2 bg-moss px-7 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>
    </main>
  );
}
