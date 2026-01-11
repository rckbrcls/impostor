# SEO Documentation

This document describes the SEO implementation for **Duplizen**.

## Overview

The application implements a comprehensive SEO strategy with bilingual support (English/Portuguese), optimized for search engines and social media sharing.

---

## Metadata Configuration

### File: `app/layout.tsx`

The root layout exports a `metadata` object with:

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| **Title**       | "Duplizen - Social Deduction Party Game"   |
| **Template**    | "%s \| Duplizen" (for child pages)         |
| **Description** | Optimized description in English (default) |
| **Keywords**    | Bilingual keywords (EN + PT)               |
| **Author**      | Polterware                                 |

---

## Open Graph (Social Sharing)

When sharing on Facebook, LinkedIn, WhatsApp, etc:

```typescript
openGraph: {
  type: "website",
  locale: "en_US",
  alternateLocale: "pt_BR",
  siteName: "Duplizen",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }]
}
```

### Image: `public/og-image.png`

- Dimensions: 1200x630px
- Content: Game logo, title, and tagline

---

## Twitter Cards

```typescript
twitter: {
  card: "summary_large_image",
  title: "Duplizen - Social Deduction Party Game",
  images: ["/og-image.png"]
}
```

---

## Sitemap

### File: `app/sitemap.ts`

Generates `/sitemap.xml` automatically with:

| URL       | Priority | Change Frequency |
| --------- | -------- | ---------------- |
| `/`       | 1.0      | weekly           |
| `/about`  | 0.8      | monthly          |
| `/create` | 0.9      | weekly           |
| `/join`   | 0.9      | weekly           |

---

## Robots.txt

### File: `app/robots.ts`

Generates `/robots.txt` with:

```
User-agent: *
Allow: /
Disallow: /room/
Sitemap: https://duplizen.vercel.app/sitemap.xml
```

> **Note**: `/room/` paths are excluded because they are dynamic game sessions that shouldn't be indexed.

---

## Structured Data (JSON-LD)

### File: `components/json-ld.tsx`

Injects WebApplication schema in the `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Duplizen",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web Browser",
  "genre": ["Party Game", "Social Deduction", "Multiplayer"],
  "inLanguage": ["en", "pt-BR"]
}
```

---

## Page-Specific Metadata

### About Page (`app/about/page.tsx`)

```typescript
export const metadata: Metadata = {
  title: "About", // Renders as "About | Duplizen"
  description: "Learn how to play Duplizen...",
};
```

---

## Testing SEO

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
4. **Sitemap**: https://duplizen.vercel.app/sitemap.xml
5. **Robots.txt**: https://duplizen.vercel.app/robots.txt
