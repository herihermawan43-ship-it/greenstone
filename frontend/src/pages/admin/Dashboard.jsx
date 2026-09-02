import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, Newspaper, Inbox, BellRing, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
  });

  const cards = [
    { label: "Products", value: stats?.products ?? "—", icon: Package, to: "/admin/products", testid: "stat-products" },
    { label: "Blog Posts", value: stats?.posts ?? "—", icon: Newspaper, to: "/admin/blog", testid: "stat-posts" },
    { label: "Total Inquiries", value: stats?.inquiries_total ?? "—", icon: Inbox, to: "/admin/inquiries", testid: "stat-inquiries" },
    { label: "New Inquiries", value: stats?.inquiries_new ?? "—", icon: BellRing, to: "/admin/inquiries", testid: "stat-inquiries-new" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-serif text-4xl font-medium">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage the public website content, catalogue, journal and incoming B2B inquiries.
      </p>

      <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            data-testid={c.testid}
            className="group bg-card p-6 transition-colors duration-200 hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5 text-brass" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-6 font-serif text-4xl font-semibold">{c.value}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <h2 className="text-xs uppercase tracking-[0.25em] text-brass">Edit Pages</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link data-testid="quick-edit-home" className="text-muted-foreground transition-colors hover:text-bone" to="/admin/pages/home">Homepage — hero, sections, FAQ, SEO</Link></li>
            <li><Link data-testid="quick-edit-about" className="text-muted-foreground transition-colors hover:text-bone" to="/admin/pages/about">About Us — story, values, quarry</Link></li>
            <li><Link data-testid="quick-edit-contact" className="text-muted-foreground transition-colors hover:text-bone" to="/admin/pages/contact">Contact — address, WhatsApp, form text</Link></li>
          </ul>
        </div>
        <div className="border border-border bg-card p-6">
          <h2 className="text-xs uppercase tracking-[0.25em] text-brass">SEO Notes</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Each page carries its own meta title, description and keywords — edit them under the “SEO Meta”
            group of every page. Product and article structured data (JSON-LD) is generated automatically,
            and the sitemap updates itself at <span className="font-mono text-xs text-bone">/sitemap.xml</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
