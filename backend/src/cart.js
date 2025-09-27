// backend/src/cart.js
const carts = new Map(); // cartId -> { items: [{item, qty}], updatedAt }

export function createCart() {
  const cartId = "cart_" + Math.random().toString(36).slice(2, 10);
  carts.set(cartId, { items: [], updatedAt: Date.now() });
  return cartId;
}

export function getCart(cartId) {
  const c = carts.get(cartId);
  return c ?? { items: [] };
}

function keyOf(it) {
  // Ürünü eşleştirmek için en stabil alan: link (yoksa image/desc fallback)
  return it?.link || it?.image || it?.name + "|" + it?.desc;
}

export function addItem(cartId, item, qty = 1) {
  if (!carts.has(cartId))
    carts.set(cartId, { items: [], updatedAt: Date.now() });
  const cart = carts.get(cartId);
  const k = keyOf(item);
  const found = cart.items.find((x) => keyOf(x.item) === k);
  if (found) {
    found.qty += qty;
  } else {
    cart.items.push({ item, qty });
  }
  cart.updatedAt = Date.now();
  return cart;
}

export function updateQty(cartId, key, qty) {
  const cart = carts.get(cartId);
  if (!cart) return { items: [] };
  const idx = cart.items.findIndex((x) => keyOf(x.item) === key);
  if (idx >= 0) {
    if (qty <= 0) cart.items.splice(idx, 1);
    else cart.items[idx].qty = qty;
    cart.updatedAt = Date.now();
  }
  return cart;
}

export function removeItem(cartId, key) {
  return updateQty(cartId, key, 0);
}

export function clearCart(cartId) {
  if (!carts.has(cartId)) return { items: [] };
  const cart = carts.get(cartId);
  cart.items = [];
  cart.updatedAt = Date.now();
  return cart;
}
