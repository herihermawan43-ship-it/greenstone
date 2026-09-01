import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="border-t border-line bg-surface">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4 flex flex-col leading-none">
            <span className="font-serif text-2xl font-semibold text-bone">Murfy Alam</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-brass">Sukabumi Green Stone</span>
          </div>
          <p className="text-sm leading-relaxed text-ash">
            PT. Murfy Alam Indonesia — factory-direct exporter of Sukabumi Green Stone (Pedra Bali) pool tiles,
            cladding and paving, serving architects and importers in 40+ countries.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-brass">Explore</h3>
          <ul className="space-y-2.5 text-sm text-ash">
            <li><Link data-testid="footer-link-home" className="transition-colors hover:text-bone" to="/">Home</Link></li>
            <li><Link data-testid="footer-link-products" className="transition-colors hover:text-bone" to="/products">Products</Link></li>
            <li><Link data-testid="footer-link-about" className="transition-colors hover:text-bone" to="/about">About Us</Link></li>
            <li><Link data-testid="footer-link-blog" className="transition-colors hover:text-bone" to="/blog">Journal</Link></li>
            <li><Link data-testid="footer-link-contact" className="transition-colors hover:text-bone" to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-brass">Products</h3>
          <ul className="space-y-2.5 text-sm text-ash">
            <li><Link data-testid="footer-prod-sukabumi" className="transition-colors hover:text-bone" to="/products/sukabumi-green-stone-tiles">Sukabumi Green Stone Tiles</Link></li>
            <li><Link data-testid="footer-prod-hijau" className="transition-colors hover:text-bone" to="/products/pedra-hijau-green-sukabumi">Pedra Hijau Green Sukabumi</Link></li>
            <li><Link data-testid="footer-prod-coping" className="transition-colors hover:text-bone" to="/products/green-stone-pool-coping-bullnose">Pool Coping &amp; Bullnose</Link></li>
            <li><Link data-testid="footer-prod-mosaic" className="transition-colors hover:text-bone" to="/products/sukabumi-green-mosaic-mesh">Green Stone Mosaic</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.25em] text-brass">Head Office</h3>
          <ul className="space-y-3 text-sm text-ash">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><span>Jl. Raya Sukabumi KM 12, Sukabumi Regency, West Java 43151, Indonesia</span></li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><a data-testid="footer-email" className="transition-colors hover:text-bone" href="mailto:export@murfyalam.com">export@murfyalam.com</a></li>
            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brass" /><a data-testid="footer-phone" className="transition-colors hover:text-bone" href="tel:+6281234567890">+62 812-3456-7890</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-3 py-6 text-xs text-ash sm:flex-row sm:items-center">
          <span data-testid="footer-copyright">© 2026 PT. Murfy Alam Indonesia. All rights reserved.</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Sukabumi · West Java · Indonesia</span>
        </div>
      </div>
    </footer>
  );
}
