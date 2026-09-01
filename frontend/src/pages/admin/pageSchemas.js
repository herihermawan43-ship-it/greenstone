const t = (key, label, type = "text") => ({ key, label: label || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "), type });

const statFields = [t("value", "Value"), t("label", "Label")];
const titleText = [t("title", "Title"), t("text", "Text", "textarea")];

export const pageSchemas = {
  home: [
    {
      key: "seo", label: "SEO Meta", type: "group",
      fields: [t("title", "Meta Title"), t("description", "Meta Description", "textarea"), t("keywords", "Keywords")],
    },
    {
      key: "hero", label: "1 · Hero", type: "group",
      fields: [
        t("overline"), t("line1", "Headline Line 1"), t("line2", "Headline Line 2 (italic accent)"),
        t("line3", "Headline Line 3"), t("subheading", "Subheading", "textarea"),
        t("image", "Background Image URL", "image"), t("cta_primary", "Primary Button"), t("cta_secondary", "Secondary Button"),
      ],
    },
    { key: "marquee", label: "2 · Marquee Words (one per line)", type: "stringlist" },
    {
      key: "manifesto", label: "3 · Manifesto", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        t("body1", "Paragraph 1", "textarea"), t("body2", "Paragraph 2", "textarea"),
        t("image", "Image URL", "image"),
        { key: "stats", label: "Stats", type: "array", itemLabel: "Stat", fields: statFields },
      ],
    },
    {
      key: "spotlight", label: "4 · Product Spotlight", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"), t("body", "Body", "textarea"),
        t("image", "Image URL", "image"),
        { key: "features", label: "Features", type: "array", itemLabel: "Feature", fields: titleText },
      ],
    },
    {
      key: "applications", label: "5 · Applications (Bento)", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        { key: "items", label: "Application Cards", type: "array", itemLabel: "Card", fields: [t("title", "Title"), t("text", "Text", "textarea"), t("image", "Image URL", "image")] },
      ],
    },
    {
      key: "values", label: "6 · B2B Value Props", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        { key: "items", label: "Value Props (3 shown)", type: "array", itemLabel: "Value", fields: titleText },
      ],
    },
    {
      key: "parallax", label: "7 · Parallax Quote", type: "group",
      fields: [t("image", "Background Image URL", "image"), t("quote", "Quote", "textarea"), t("author", "Attribution")],
    },
    {
      key: "global", label: "8 · Global Reach", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"), t("body", "Body", "textarea"),
        { key: "regions", label: "Regions (one per line)", type: "stringlist" },
        { key: "stats", label: "Stats", type: "array", itemLabel: "Stat", fields: statFields },
      ],
    },
    {
      key: "process", label: "9 · Process Steps", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        { key: "steps", label: "Steps", type: "array", itemLabel: "Step", fields: [t("num", "No."), t("title", "Title"), t("text", "Text", "textarea")] },
      ],
    },
    {
      key: "projects", label: "10 · Projects", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        { key: "items", label: "Projects", type: "array", itemLabel: "Project", fields: [t("title", "Title"), t("location", "Location"), t("image", "Image URL", "image")] },
      ],
    },
    {
      key: "testimonials", label: "11 · Testimonials", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        { key: "items", label: "Testimonials", type: "array", itemLabel: "Testimonial", fields: [t("quote", "Quote", "textarea"), t("name", "Name"), t("role", "Role")] },
      ],
    },
    {
      key: "faq", label: "12 · FAQ (AEO / Schema)", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("overline"), t("title", "Title"),
        { key: "items", label: "Questions", type: "array", itemLabel: "Question", fields: [t("q", "Question"), t("a", "Answer", "textarea")] },
      ],
    },
    {
      key: "cta", label: "13 · Final CTA", type: "group",
      fields: [t("title", "Title"), t("text", "Text", "textarea"), t("button", "Button Label")],
    },
  ],
  about: [
    {
      key: "seo", label: "SEO Meta", type: "group",
      fields: [t("title", "Meta Title"), t("description", "Meta Description", "textarea"), t("keywords", "Keywords")],
    },
    {
      key: "hero", label: "Hero", type: "group",
      fields: [t("overline"), t("title", "Title"), t("body", "Intro", "textarea"), t("image", "Background Image URL", "image")],
    },
    {
      key: "story", label: "Our Story", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("title", "Title"),
        { key: "paragraphs", label: "Paragraphs (one per line, blank line = new paragraph)", type: "stringlist" },
        t("image", "Image URL", "image"),
      ],
    },
    {
      key: "values", label: "Values", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("title", "Title"),
        { key: "items", label: "Values", type: "array", itemLabel: "Value", fields: titleText },
      ],
    },
    { key: "stats", label: "Stats", type: "array", itemLabel: "Stat", fields: statFields },
    {
      key: "quarry", label: "The Quarry", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("title", "Title"), t("body", "Body", "textarea"), t("image", "Image URL", "image"),
        { key: "bullets", label: "Bullet Points (one per line)", type: "stringlist" },
      ],
    },
    {
      key: "certifications", label: "Certifications", type: "group",
      fields: [
        t("chapter", "Chapter No."), t("title", "Title"),
        { key: "items", label: "Items", type: "array", itemLabel: "Item", fields: titleText },
      ],
    },
    {
      key: "cta", label: "Final CTA", type: "group",
      fields: [t("title", "Title"), t("text", "Text", "textarea"), t("button", "Button Label")],
    },
  ],
  contact: [
    {
      key: "seo", label: "SEO Meta", type: "group",
      fields: [t("title", "Meta Title"), t("description", "Meta Description", "textarea"), t("keywords", "Keywords")],
    },
    {
      key: "hero", label: "Hero", type: "group",
      fields: [t("overline"), t("title", "Title"), t("body", "Intro", "textarea")],
    },
    {
      key: "info", label: "Contact Information", type: "group",
      fields: [
        t("address", "Address", "textarea"), t("phone", "Phone"), t("whatsapp", "WhatsApp Number (digits only, e.g. 62812…)"),
        t("email", "Email"), t("hours", "Business Hours"),
      ],
    },
    {
      key: "form", label: "Form Copy", type: "group",
      fields: [t("title", "Form Title"), t("text", "Form Helper Text", "textarea")],
    },
    {
      key: "faq", label: "Contact FAQ", type: "group",
      fields: [
        t("title", "Title"),
        { key: "items", label: "Questions", type: "array", itemLabel: "Question", fields: [t("q", "Question"), t("a", "Answer", "textarea")] },
      ],
    },
  ],
};

export const pageTitles = { home: "Homepage", about: "About Page", contact: "Contact Page" };
