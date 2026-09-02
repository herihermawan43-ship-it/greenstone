import { useEffect, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";
import NotFound from "@/pages/NotFound";

// Every page is code-split into its own chunk so a public visitor's initial
// load only pulls the page they're on — not the entire admin dashboard and
// its ~100KB rich-text editor, which used to ship in the one shared bundle.
const Home = lazy(() => import("@/pages/site/Home"));
const About = lazy(() => import("@/pages/site/About"));
const Contact = lazy(() => import("@/pages/site/Contact"));
const Products = lazy(() => import("@/pages/site/Products"));
const ProductDetail = lazy(() => import("@/pages/site/ProductDetail"));
const Blog = lazy(() => import("@/pages/site/Blog"));
const BlogPost = lazy(() => import("@/pages/site/BlogPost"));
const Export = lazy(() => import("@/pages/site/Export"));
const ExportCountry = lazy(() => import("@/pages/site/ExportCountry"));
const SupplierPage = lazy(() => import("@/pages/site/SupplierPage"));

const Login = lazy(() => import("@/pages/admin/Login"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const PageEditor = lazy(() => import("@/pages/admin/PageEditor"));
const ProductsAdmin = lazy(() => import("@/pages/admin/ProductsAdmin"));
const ProductEditor = lazy(() => import("@/pages/admin/ProductEditor"));
const PostsAdmin = lazy(() => import("@/pages/admin/PostsAdmin"));
const PostEditor = lazy(() => import("@/pages/admin/PostEditor"));
const InquiriesAdmin = lazy(() => import("@/pages/admin/InquiriesAdmin"));
const KeywordsAdmin = lazy(() => import("@/pages/admin/KeywordsAdmin"));
const SeoExplorer = lazy(() => import("@/pages/admin/SeoExplorer"));
const SettingsAdmin = lazy(() => import("@/pages/admin/SettingsAdmin"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <span className="animate-pulse font-serif text-2xl text-ash">Murfy Alam</span>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Analytics() {
  const location = useLocation();
  useEffect(() => {
    // Skip admin/dashboard usage — GA4 should measure visitor behavior, not our own.
    if (location.pathname.startsWith("/admin")) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
  return null;
}

function SiteShell({ children }) {
  return (
    <div className="grain min-h-screen bg-ink">
      <Navbar />
      {children}
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Analytics />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<SiteShell><Home /></SiteShell>} />
              <Route path="/about" element={<SiteShell><About /></SiteShell>} />
              <Route path="/contact" element={<SiteShell><Contact /></SiteShell>} />
              <Route path="/products" element={<SiteShell><Products /></SiteShell>} />
              <Route path="/products/:slug" element={<SiteShell><ProductDetail /></SiteShell>} />
              <Route path="/blog" element={<SiteShell><Blog /></SiteShell>} />
              <Route path="/blog/:slug" element={<SiteShell><BlogPost /></SiteShell>} />
              <Route path="/export" element={<SiteShell><Export /></SiteShell>} />
              <Route path="/export/:slug" element={<SiteShell><ExportCountry /></SiteShell>} />
              <Route path="/supplier/:keyword/:country" element={<SiteShell><SupplierPage /></SiteShell>} />

              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="pages/:slug" element={<PageEditor />} />
                <Route path="products" element={<ProductsAdmin />} />
                <Route path="products/new" element={<ProductEditor />} />
                <Route path="products/:id/edit" element={<ProductEditor />} />
                <Route path="blog" element={<PostsAdmin />} />
                <Route path="blog/new" element={<PostEditor />} />
                <Route path="blog/:id/edit" element={<PostEditor />} />
                <Route path="inquiries" element={<InquiriesAdmin />} />
                <Route path="keywords" element={<KeywordsAdmin />} />
                <Route path="seo-explorer" element={<SeoExplorer />} />
                <Route path="settings" element={<SettingsAdmin />} />
              </Route>

              <Route path="*" element={<SiteShell><NotFound /></SiteShell>} />
            </Routes>
          </Suspense>
          <Toaster theme="dark" position="bottom-left" />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
