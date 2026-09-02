# Changelog — Greenstone Supplier Website

Catatan ini merangkum semua perubahan yang dikerjakan (lewat Claude Code) pada
project ini, dari saat website mulai dilepas dari platform Emergent sampai
perbaikan performa terakhir. Ditulis supaya developer lain bisa langsung
paham apa yang berubah, kenapa, dan di file mana — tanpa harus baca ulang
seluruh riwayat commit satu per satu.

Setiap commit hash di bawah bisa dicek detailnya dengan:
```
git show <hash>
```

---

## 1. Lepas dari platform Emergent

Sebelumnya aplikasi ini bergantung pada API key dan tracking script bawaan
platform Emergent (tempat aplikasi ini pertama kali dibuat). Semua itu
dilepas supaya aplikasi sepenuhnya independen dan dikontrol sendiri oleh
pemilik website.

- **`08261e3`** — Decouple from Emergent platform: backend sekarang membaca
  API key AI (OpenAI/Anthropic/Gemini) dan konfigurasi SMTP dari environment
  milik sendiri, bukan lagi dari layanan Emergent.
- **`9270040`** — API key & SMTP jadi bisa diatur lewat **Admin Panel**
  (`/admin/settings`), tidak harus edit file `.env` di server. Nilai
  disimpan terenkripsi (Fernet) di MongoDB — lihat `backend/settings_service.py`.
  Kalau field dikosongkan, otomatis fallback ke `.env`.
- **`2408e6a`** — Menghapus script tracking bawaan Emergent dari frontend
  (`frontend/public/index.html`) yang sebelumnya ikut termuat di setiap
  halaman publik.

File kunci: `backend/settings_service.py`, `backend/autoblog.py`,
`backend/email_service.py`, `frontend/src/pages/admin/SettingsAdmin.jsx`.

---

## 2. Deploy ke VPS sendiri (CloudPanel)

- **`a9f94f2`** — Frontend React (build hasil `npm run build`) sekarang
  di-serve langsung oleh proses FastAPI yang sama (satu proses Uvicorn,
  2 workers, port 8001) — jadi tidak perlu Nginx/Node terpisah untuk serve
  static file frontend. Reverse proxy CloudPanel cukup diarahkan ke port ini.
- Domain `greenstonesupplier.com` di-setup di CloudPanel (tipe site:
  reverse proxy), SSL Let's Encrypt via `clpctl`, mencakup `www` subdomain.
- MongoDB 8.0 dipasang di VPS (MongoDB 7.0 tidak tersedia untuk Ubuntu 24.04
  "noble", jadi pakai versi 8.0).

**Cara deploy update ke VPS** (selalu jalankan sebagai user `greenstone`,
bukan `root`, dan gunakan path absolut — jangan pakai `~` waktu sudah `su`
karena artinya bisa berubah):
```
cd /home/greenstone/htdocs/greenstonesupplier.com
git pull origin <branch>
cd frontend && npm run build     # kalau ada perubahan di frontend/
sudo systemctl restart greenstone-backend   # kalau ada perubahan di backend/
```

---

## 3. Admin Panel — dari popup modal ke halaman penuh + editor WYSIWYG

Semula edit produk/artikel pakai modal popup (mirip form kecil di tengah
layar). Diubah total supaya lebih nyaman dipakai untuk konten panjang,
mirip **WordPress Classic Editor**.

- **`9862ce5`** — Edit produk dipindah dari dialog/modal ke halaman penuh.
- **`73ee79e`** — Editor artikel blog pakai **TipTap** (WYSIWYG rich text
  editor) lengkap dengan toolbar ala WordPress: bold/italic, heading,
  list, link, gambar, dsb. Lihat `frontend/src/components/admin/RichTextEditor.jsx`.
- **`b90ae27`** — Upload multi-gambar untuk galeri produk
  (`frontend/src/components/admin/MultiImageUpload.jsx`), perbaikan scroll
  dialog admin.
- Field upload gambar (URL manual → upload file) dilengkapi di semua form
  admin (`ImageUpload.jsx`, `MultiImageUpload.jsx`).
- SEO helper (`SeoFields.jsx`) — penghitung karakter dan preview meta
  title/description langsung di form edit halaman/produk/artikel.
- **`c1ddc7b`** — Kemampuan upload file untuk gambar admin (awalnya hanya
  bisa input URL gambar).

File kunci: `frontend/src/pages/admin/PostEditor.jsx`,
`frontend/src/pages/admin/ProductEditor.jsx`,
`frontend/src/pages/admin/PageEditor.jsx`,
`frontend/src/components/admin/*`.

---

## 4. SEO & Structured Data

- **`fb06c83`** — `sitemap.xml`, `robots.txt`, `llms.txt` di-serve langsung
  di root domain (`https://greenstonesupplier.com/sitemap.xml`, dst).
- **`10c6e91`** — 301 redirect untuk URL lama peninggalan WordPress yang
  masih terindeks Google (domain ini dulu pakai WordPress dengan struktur
  URL berbeda sebelum jadi aplikasi React ini — tanpa redirect, klik dari
  hasil pencarian Google lama akan berakhir di 404).
- **`323ac42`** — Structured data (JSON-LD) diperbaiki: `Product` offer yang
  tadinya tidak valid menurut skema schema.org, plus breadcrumb
  (`BreadcrumbList`) ditambahkan di semua halaman produk/artikel/negara ekspor.
- **`41435aa`**, **`acb5e56`** — Data `Organization` di JSON-LD dilengkapi
  alamat lengkap (jalan, kode pos) dan field `image`.
- **`9862ce5`**/**`3cb7797`** — Meta tag `og:image` & `twitter:image`
  ditambahkan (statis) supaya link preview di WhatsApp/Facebook/Twitter
  menampilkan gambar produk, bukan kosong.
- **`3b564cd`** — Google Analytics 4 dipasang (`G-XHJE26L8E5`), tracking
  page-view manual per halaman karena ini Single Page App (SPA) —
  lihat komponen `Analytics` di `frontend/src/App.js`.
- Semua gambar diupload pakai `absoluteUrl()` helper
  (`frontend/src/components/site/SEO.jsx`, `frontend/src/lib/schema.js`)
  supaya URL gambar di JSON-LD/og:image selalu absolut (`https://...`),
  bukan relatif (`/uploads/...`) — Open Graph & rich snippet Google
  mengharuskan URL absolut.

---

## 5. Keamanan

- **`64c0325`** — **XSS lewat upload gambar**: dulu kalau proses resize
  gambar (Pillow) gagal, sistem fallback mempercayai ekstensi file dari
  nama file yang dikirim client — jadi file `payload.html` yang di-klaim
  sebagai `image/png` bisa tersimpan & ter-serve sebagai HTML dari domain
  sendiri. Diperbaiki dengan whitelist tetap content-type → ekstensi,
  tidak pernah lagi mempercayai nama file dari client.
  Lihat `backend/server.py` (`_UPLOAD_CONTENT_TYPE_EXT`).
- **`db5210d`** — **Rate limiting** ditambahkan ke endpoint publik yang
  sebelumnya rawan disalahgunakan bot/spam:
  - `/api/auth/login` — maksimal 10 percobaan / 15 menit per IP
  - `/api/inquiries` (form kontak) — maksimal 5 pengiriman / 10 menit per IP
  
  Disimpan di MongoDB (bukan memori proses) supaya berlaku across 2 worker
  process backend, dengan TTL index otomatis membersihkan data lama.
  Lihat fungsi `rate_limiter()` di `backend/server.py`.
- Masih ada 1 item keamanan **belum dikerjakan** yang perlu diperhatikan
  developer: password admin default masih ada fallback hardcoded di kode
  (`os.environ.get('ADMIN_PASSWORD', 'MurfyStone2026')` di `backend/server.py`).
  Sebaiknya dihapus fallback-nya, atau minimal dipastikan env var
  `ADMIN_PASSWORD` di server produksi sudah diisi dengan password yang kuat
  dan **bukan** nilai default itu.

---

## 6. Bug fixes penting

- **`64c0325`** — Audit menyeluruh menemukan 9 bug sekaligus, termasuk:
  risiko crash (`KeyError`) di `backend/countries_data.py` saat semua
  keyword SEO dihapus, state form admin yang stale (ketinggalan) saat upload
  gambar berlangsung lama, preview yang tidak update, dan beberapa lainnya.
- **`56747d1`** — Bug closure di **Homepage/About/Contact page editor**
  (`PageEditor.jsx`): kalau user upload gambar lalu langsung mengedit field
  teks lain sebelum upload selesai, perubahan field teks itu bisa
  **hilang tertimpa** begitu upload selesai. Diperbaiki dengan pola
  "updater function" (`applyUpdate`) yang dialirkan lewat semua level form
  bersarang, supaya update selalu berdasarkan state terbaru, bukan snapshot
  lama.
- Bug serupa (state form ketimpa gara-gara closure lama) juga diperbaiki di
  form admin lain: `PostEditor.jsx`, `ProductEditor.jsx`, `Contact.jsx`,
  `KeywordsAdmin.jsx` — semua diubah pakai `setState(prev => ...)`
  (functional update) alih-alih `setState({...state, ...})`.
- **Data admin "nyangkut" saat pindah halaman edit**: React Router tidak
  me-remount komponen kalau hanya parameter URL (`:id`) yang berubah —
  jadi buka `/admin/blog/A/edit` lalu `/admin/blog/B/edit` bisa masih
  menampilkan data artikel A sesaat. Diperbaiki dengan trik
  `key={id || "new"}` di `PostEditor.jsx`/`ProductEditor.jsx`.
- **Pengaturan API key/SMTP ketimpa balik ke nilai `.env` lama**: form
  Settings dulu selalu mengirim semua field saat disimpan, termasuk yang
  cuma nilai fallback dari `.env` — jadi sekali disimpan, perubahan di
  `.env` server jadi tidak berpengaruh lagi. Diperbaiki dengan
  diff-based save (`SettingsAdmin.jsx`) yang hanya mengirim field yang
  benar-benar diubah admin.
- **`og:image` relatif**: gambar upload tersimpan sebagai path relatif
  (`/uploads/xxx.webp`), padahal Open Graph & JSON-LD butuh URL absolut —
  diperbaiki lewat helper `absoluteUrl()` (lihat bagian SEO di atas).

---

## 7. Performa

- **`9e255d2`**, **`efcc37c`** — **Lenis smooth-scroll dihapus total** dari
  seluruh website (termasuk dependency-nya dari `package.json`) karena
  bikin halaman terasa "berat" saat di-scroll, dan sempat menyebabkan
  scroll saling berebut (fighting) di editor halaman admin.
- Gambar upload dikompres otomatis (resize maksimal 2200px, re-encode ke
  JPEG/PNG/WEBP) di `backend/server.py`, bukan disimpan mentah dari upload.
- **`ce5c5d1`** — **Code-splitting** semua halaman (React `lazy()` +
  `Suspense`, lihat `frontend/src/App.js`). Sebelumnya *setiap* pengunjung
  publik (misal buka halaman produk) ikut mendownload seluruh bundle admin
  panel termasuk editor TipTap (~100KB) walau tidak butuh sama sekali.
  Sekarang tiap halaman punya chunk JS sendiri, dimuat sesuai kebutuhan.
- **`e2f0dd4`** — Index MongoDB yang hilang ditambahkan:
  - `keywords.slug` (unique) — dipakai `find_one()` di endpoint
    `/api/countries/:slug` dan `/api/supplier/:kw/:country`, tapi
    sebelumnya tidak ada index (beda dengan `products.slug`/`posts.slug`
    yang sudah ada indexnya).
  - Compound index `(key, ip, ts)` di collection `rate_limits` — supaya
    fitur rate limiting yang baru ditambahkan (lihat bagian Keamanan) tidak
    jadi collection scan di setiap request yang dijaga.
- **`0c983e2`** — Perbaikan `loading`/`fetchPriority` pada `<img>`:
  - 4 gambar di bawah lipatan (below-the-fold) di Homepage yang tadinya
    tanpa atribut apa pun (dimuat serentak dengan hero image) sekarang
    diberi `loading="lazy"`.
  - Gambar hero di halaman `/blog` dan halaman artikel blog (kandidat
    elemen LCP) diberi `fetchPriority="high"`, konsisten dengan hero image
    di Home/About/ProductDetail/SupplierPage yang sudah lebih dulu punya
    atribut ini.

---

## Ringkasan status saat ini

| Area | Status |
|---|---|
| Independen dari Emergent (API key, SMTP) | ✅ Selesai |
| Deploy di VPS sendiri (CloudPanel) | ✅ Selesai |
| Admin panel full-page + WYSIWYG editor | ✅ Selesai |
| SEO dasar (sitemap, redirect, JSON-LD, GA4) | ✅ Selesai |
| Rate limiting endpoint publik | ✅ Selesai |
| Code-splitting & index MongoDB | ✅ Selesai |
| Image loading hints (lazy/fetchPriority) | ✅ Selesai |
| Hardcoded default admin password fallback | ⚠️ **Belum** — perlu ditinjau |
| Soft-404 untuk sebagian URL lama WordPress | ⚠️ Diketahui, sengaja tidak di-redirect (lihat § 4) karena tidak ada halaman pengganti yang relevan — dibiarkan 404 sesuai panduan Google |
