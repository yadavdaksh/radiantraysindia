/**
 * Expands a product array so each active variant gets its own card.
 * Products with no variants (or variants array empty) appear as-is.
 * Products with variants appear once per variant — no bare parent card.
 */
export function expandToVariantCards(products: any[]): any[] {
  const cards: any[] = [];

  for (const prod of products) {
    const variants: any[] = (prod.variants || []).filter((v: any) => v.isActive !== false);

    if (variants.length === 0) {
      cards.push(prod);
      continue;
    }

    for (const variant of variants) {
      // Resolve best image for this variant
      const variantImg =
        variant.images?.find((i: any) => i.isPrimary)?.url ||
        variant.images?.[0]?.url ||
        variant.imageUrl ||
        null;

      cards.push({
        ...prod,
        // Override display fields for this variant card
        _variantCard: true,
        _variantSlug: variant.slug,
        _variantId: variant.id,
        name: `${prod.name} — ${variant.name}`,
        // Override slug so ProductCard link goes to ?variant=
        slug: prod.slug,
        _productSlug: prod.slug,
        // Price: variant price takes precedence
        basePrice: variant.price ?? prod.basePrice,
        salePrice: variant.salePrice ?? prod.salePrice,
        // Image: use variant image if available
        _variantImageUrl: variantImg,
        // Keep original variants for product page
        variants: prod.variants,
      });
    }
  }

  return cards;
}

/** Build the href for a card (variant card → product page with ?variant= param) */
export function cardHref(card: any): string {
  const base = `/products/${card._productSlug || card.slug}`;
  if (card._variantCard && card._variantSlug) {
    return `${base}?variant=${card._variantSlug}`;
  }
  return base;
}
