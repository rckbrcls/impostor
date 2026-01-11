export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Duplizen",
    description:
      "A realtime multiplayer social deduction game where everyone plays on their own phone. No app download required - find the impostor among your friends directly in the browser.",
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
    genre: ["Social Deduction", "Multiplayer", "Party Game"],
    inLanguage: ["en", "pt-BR"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
