import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import WhatsAppFloat from "@/components/site/WhatsAppFloat";
import Home from "@/pages/site/Home";
import About from "@/pages/site/About";
import Contact from "@/pages/site/Contact";
import Products from "@/pages/site/Products";
import ProductDetail from "@/pages/site/ProductDetail";
import Blog from "@/pages/site/Blog";
import BlogPost from "@/pages/site/BlogPost";
import Export from "@/pages/site/Export";
import ExportCountry from "@/pages/site/ExportCountry";
import SupplierPage from "@/pages/site/SupplierPage";
import NotFound from "@/pages/NotFound";

import Login from "@/pages/admin/Login";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import PageEditor from "@/pages/admin/PageEditor";
import ProductsAdmin from "@/pages/admin/ProductsAdmin";
import PostsAdmin from "@/pages/admin/PostsAdmin";
import InquiriesAdmin from "@/pages/admin/InquiriesAdmin";
import KeywordsAdmin from "@/pages/admin/KeywordsAdmin";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
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
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
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
              <Route path="blog" element={<PostsAdmin />} />
              <Route path="inquiries" element={<InquiriesAdmin />} />
              <Route path="keywords" element={<KeywordsAdmin />} />
            </Route>

            <Route path="*" element={<SiteShell><NotFound /></SiteShell>} />
          </Routes>
          <Toaster theme="dark" position="bottom-left" />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
