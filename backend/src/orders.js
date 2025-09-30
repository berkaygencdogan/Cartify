// backend/src/orders.js
import { getCart, clearCart } from "./cart.js";

const orders = new Map(); // orderId -> order
function newId(prefix = "ord") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseTL(str) {
  if (!str) return 0;
  const n = parseFloat(
    String(str)
      .replace(/\s*TL$/i, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
  return Number.isFinite(n) ? n : 0;
}

export function createOrderFromCart(cartId, customer = null) {
  const cart = getCart(cartId);
  const items = (cart.items || []).map((r) => ({
    item: r.item,
    qty: r.qty || 1,
    unitPrice: parseTL(r.item?.price),
    lineTotal: (r.qty || 1) * parseTL(r.item?.price),
  }));

  const subTotal = items.reduce((s, x) => s + x.lineTotal, 0);
  const shipping = 0;
  const grandTotal = subTotal + shipping;

  const order = {
    id: newId(),
    cartId,
    customer, // {name,email,phone,address} gibi alanlar koyabilirsin
    items,
    currency: "TRY",
    subTotal,
    shipping,
    grandTotal,
    status: "PLACED", // PLACED -> PAID -> SHIPPED ...
    createdAt: new Date().toISOString(),
  };

  orders.set(order.id, order);
  clearCart(cartId); // siparişten sonra sepeti boşalt
  return order;
}

export function getOrder(id) {
  return orders.get(id) || null;
}

export function listOrders({ cartId } = {}) {
  const all = Array.from(orders.values());
  return cartId ? all.filter((o) => o.cartId === cartId) : all;
}
