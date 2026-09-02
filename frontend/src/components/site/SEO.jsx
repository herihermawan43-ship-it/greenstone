import { Helmet } from "react-helmet-async";

const SITE = process.env.REACT_APP_BACKEND_URL;
const SITE_NAME = "PT. Murfy Alam Indonesia";

// og:image and schema.org `image` must be absolute URLs — uploaded images are
// stored as relative paths (/uploads/xxx.webp), so resolve those against SITE.
function absoluteUrl(u) {
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`;
}

export default function SEO({ title, description, keywords, image, path = "", type = "website", jsonLd }) {
  const url = `${SITE}${path}`;
  const absImage = absoluteUrl(image);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      {absImage && <meta property="og:image" content={absImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {absImage && <meta name="twitter:image" content={absImage} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
