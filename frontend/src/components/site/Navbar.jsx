import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/export", label: "Export" },
  { to: "/about", label: "About Us" },
  { to: "/blog", label: "Journal" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      data-testid="site-navbar"
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500 ${
        scrolled || open ? "border-line bg-ink/85 backdrop-blur-xl" : "border-transparent bg-ink/40 backdrop-blur-md"
      }`}
    >
      <div className="container-x flex h-20 items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="group flex flex-col leading-none">
          <span className="font-serif text-2xl font-semibold tracking-tight text-bone">Murfy Alam</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-brass">Sukabumi Green Stone</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" data-testid="nav-desktop">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `text-xs uppercase tracking-[0.2em] transition-colors duration-300 hover:text-brass ${
                  isActive ? "text-brass" : "text-ash"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/contact"
            data-testid="nav-quote-btn"
            className="group flex items-center gap-2 bg-moss px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-mosslight"
          >
            Get a Quote
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </nav>

        <button
          data-testid="nav-mobile-toggle"
          className="text-bone lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-ink/95 backdrop-blur-xl lg:hidden" data-testid="nav-mobile-menu">
          <div className="container-x flex flex-col gap-6 py-8">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={`nav-mobile-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `font-serif text-3xl transition-colors ${isActive ? "text-brass" : "text-bone"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/contact"
              data-testid="nav-mobile-quote-btn"
              className="mt-2 inline-flex w-fit items-center gap-2 bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white"
            >
              Get a Quote <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
