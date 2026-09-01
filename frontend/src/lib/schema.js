const SITE = process.env.REACT_APP_BACKEND_URL;

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
