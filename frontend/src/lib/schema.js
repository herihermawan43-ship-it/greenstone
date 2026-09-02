const SITE = process.env.REACT_APP_BACKEND_URL;

// Uploaded images are stored as relative paths (/uploads/xxx.webp); og:image
// and schema.org `image` fields require absolute URLs.
export function absoluteUrl(u) {
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`;
}

// items: [{ name, path }]. Omit `path` on the last (current-page) item — it's
// optional per Google's guidelines and the page is already at that URL.
export function breadcrumbJsonLd(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE}${item.path}` } : {}),
    })),
  };
}
