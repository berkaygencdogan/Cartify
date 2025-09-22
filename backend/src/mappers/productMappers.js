// Tüm kaynakları bu şemaya normalize edeceğiz:
export function mapToProduct(x) {
  return {
    id: String(x.id ?? x.productId ?? x.sku ?? x.barcode ?? cryptoRandom()),
    title: x.title ?? x.name ?? "",
    description: x.description ?? "",
    price: Number(x.price ?? x.salePrice ?? x.currentPrice ?? 0),
    currency: (x.currency ?? "TRY").toUpperCase(),
    brand: x.brand ?? null,
    category: x.category ?? x.categoryName ?? null,
    thumbnail: x.thumbnail ?? x.image ?? x.imageUrl ?? null,
    images: Array.isArray(x.images) ? x.images : x.image ? [x.image] : [],
    rating: typeof x.rating === "number" ? x.rating : null,
    stock: typeof x.stock === "number" ? x.stock : null,
    source: x.source ?? "local",
  };
}

// basit random id fallback
function cryptoRandom() {
  return "tmp_" + Math.random().toString(36).slice(2, 10);
}
