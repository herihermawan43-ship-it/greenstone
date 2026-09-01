import { NavLink, Outlet, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, FileText, Info, Phone, Package, Newspaper, Inbox, LogOut, Globe, Tags, Network,
} from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pages/home", label: "Homepage", icon: FileText },
  { to: "/admin/pages/about", label: "About Page", icon: Info },
  { to: "/admin/pages/contact", label: "Contact Page", icon: Phone },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { to: "/admin/keywords", label: "SEO Keywords", icon: Tags },
  { to: "/admin/seo-explorer", label: "Programmatic Pages", icon: Network },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink" data-testid="admin-loading">
        <span className="animate-pulse font-serif text-2xl text-ash">Murfy Alam</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-ink text-bone" data-testid="admin-layout">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-6">
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl font-semibold">Murfy Alam</span>
            <span className="mt-1.5 text-[9px] uppercase tracking-[0.3em] text-brass">CMS Dashboard</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" data-testid="admin-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200 ${
                  isActive ? "bg-moss/25 text-bone" : "text-muted-foreground hover:bg-muted hover:text-bone"
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/"
            data-testid="admin-view-site"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-bone"
          >
            <Globe className="h-4 w-4" /> View Website
          </Link>
          <button
            onClick={handleLogout}
            data-testid="admin-logout-btn"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-bone"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-ink/85 px-8 backdrop-blur-xl">
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground" data-testid="admin-topbar-title">
            Content Management
          </span>
          <span className="text-xs text-muted-foreground" data-testid="admin-user-email">{user.email}</span>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
