# PRD — PT. Murfy Alam Indonesia (Sukabumi Green Stone / Pedra Bali B2B Exporter Website)

## Original Problem Statement
"saya ingin membuat website untuk produk sukabumi green stone atau pedra bali dengan target B2B luar negeri, buatkan secara profesional dan juga sudah teroptimasi SEO, GEO, AIO, AEO, agar mampu bersaing di google, buat dasboard admin nya juga unutk menajamen konten nya lengkap untuk edit homepage, about us, contact us, blog, product. minimal 13 section perpage nya, lengkap dan tampilan manarik serta profesional"

## User Decisions (2026-09-01)
- Language: English only (B2B international target)
- Contact: WhatsApp button + inquiry form stored in admin dashboard (no email integration)
- Admin auth: email + password (JWT, httpOnly cookie)
- Brand: PT. Murfy Alam Indonesia
- Look: natural stone green + dark elegant, award-level editorial design

## User Personas
- International stone importer / distributor evaluating a new Indonesian supplier
- Architect / resort developer specifying pool stone (Pedra Bali)
- Site owner (admin) managing content, products, blog and B2B inquiries

## Architecture
- Backend: FastAPI (`/app/backend/server.py` + `seed_data.py`), MongoDB via MONGO_URL, collections: users, pages, products, posts, inquiries
- Auth: JWT in httpOnly cookie (7d), admin seeded idempotently from ADMIN_EMAIL/ADMIN_PASSWORD env
- Frontend: React (CRA/craco), Tailwind, framer-motion, lenis smooth scroll, react-fast-marquee, react-helmet-async, TanStack Query, shadcn/ui
- Public site routes: /, /about, /contact, /products, /products/:slug, /blog, /blog/:slug
- Admin routes: /admin/login, /admin (dashboard), /admin/pages/:slug, /admin/products, /admin/blog, /admin/inquiries

## Core Requirements (static)
1. Homepage with 13 sections, dark elegant stone-green aesthetic
2. SEO/GEO/AIO/AEO: JSON-LD (Organization, FAQPage, Product, Article), semantic HTML, meta per page, robots.txt, dynamic sitemap.xml
3. CMS admin: edit homepage/about/contact content, CRUD products, CRUD blog, view inquiries
4. WhatsApp floating CTA + inquiry form saved to dashboard

## Implemented (2026-09-01)
- 13-section homepage: kinetic masked-reveal hero + parallax, editorial marquee, manifesto (01), product spotlight (02), applications bento (03), B2B values (04), parallax quote divider, global reach (05), process timeline (06), projects horizontal scroll (07), testimonials (08), FAQ accordion + FAQPage schema (09), final CTA
- About page: hero, story, values, stats, quarry, certifications, CTA
- Contact page: info blocks, WhatsApp CTA, inquiry form → MongoDB, contact FAQ
- Products: 6 seeded (Sukabumi tiles, Pedra Hijau, coping/bullnose, mosaic, black lava, andesite) + detail pages with Product JSON-LD, specs, gallery, related products
- Blog: 4 seeded SEO articles + detail pages with Article JSON-LD
- SEO: per-page meta via Helmet, canonical/OG/Twitter tags, robots.txt, dynamic /api/sitemap.xml
- Admin dashboard: stats, schema-driven page editor (all sections incl. arrays), product CRUD dialog, post CRUD dialog with publish switch, inquiries table with view/mark-read/delete
- Seed content is professional B2B copy; all editable from admin

## Verified
- curl: /api/health, /api/pages/home, /api/products(6), /api/posts(4), auth login/me chain, admin page PUT save, inquiry POST, /api/sitemap.xml
- UI screenshots: home hero + sections, contact form submit (toast confirmed), products grid, admin login → dashboard → homepage editor → inquiries

## Backlog (prioritized)
- P0: Replace placeholder contact data (WhatsApp number 6281234567890, email export@murfyalam.com, address) with real company data via admin → Contact Page
- P0: Replace stock images with real product photography (image URL fields ready in admin)
- P1: Email notification on new inquiry (Resend integration available)
- P1: Google Search Console verification + custom domain for production SEO
- P2: Multi-language (Indonesian version), product image upload to object storage, blog categories/search

## Next Tasks
1. Ask owner for real WhatsApp number/email/address and update via admin
2. Upload real stone photography per product
3. Add email notification for inquiries
