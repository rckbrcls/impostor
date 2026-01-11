export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Duplizen",
    description:
      "A multiplayer social deduction party game where players try to find the impostor among their friends.",
    url: "https://duplizen.vercel.app",
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Polterware",
      url: "https://www.polterware.com",
    },
    genre: ["Party Game", "Social Deduction", "Multiplayer"],
    inLanguage: ["en", "pt-BR"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
