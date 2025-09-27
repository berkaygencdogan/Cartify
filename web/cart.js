// web/cart.js
const API_BASE = ""; // same-origin

let CART_ID = localStorage.getItem("cartify_cartId") || null;

async function ensureCart() {
  if (CART_ID) return CART_ID;
  const r = await fetch(`${API_BASE}/api/cart/init`, { method: "POST" });
  const { cartId } = await r.json();
  CART_ID = cartId;
  localStorage.setItem("cartify_cartId", CART_ID);
  return CART_ID;
}

async function getCart() {
  await ensureCart();
  const r = await fetch(
    `${API_BASE}/api/cart?cartId=${encodeURIComponent(CART_ID)}`
  );
  if (!r.ok) throw new Error("get cart failed");
  return r.json();
}

async function updateQty(key, qty) {
  const r = await fetch(`${API_BASE}/api/cart/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId: CART_ID, key, qty: Number(qty) }),
  });
  if (!r.ok) throw new Error("update failed");
  return r.json();
}

async function removeItem(key) {
  const r = await fetch(`${API_BASE}/api/cart/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId: CART_ID, key }),
  });
  if (!r.ok) throw new Error("remove failed");
  return r.json();
}

async function clearCart() {
  const r = await fetch(`${API_BASE}/api/cart/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId: CART_ID }),
  });
  if (!r.ok) throw new Error("clear failed");
  return r.json();
}

function formatTLtoNumber(str) {
  if (!str) return 0;
  const num = String(str)
    .replace(/\s*TL$/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(num);
  return Number.isFinite(n) ? n : 0;
}
function numberToTL(n) {
  return (
    n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " TL"
  );
}

function keyOf(it) {
  return it?.link || it?.image || (it?.name || "") + "|" + (it?.desc || "");
}

function updateBadge(cart) {
  const totalQty = (cart.items || []).reduce((s, x) => s + (x.qty || 0), 0);
  $("#cartBadge").text(totalQty);
}

function renderCart(cart) {
  const items = cart.items || [];
  updateBadge(cart);

  if (items.length === 0) {
    $("#cartEmpty").show();
    $("#cartSummary").hide();
    $("#cartBody").html("");
    return;
  }

  $("#cartEmpty").hide();
  $("#cartSummary").show();

  let rows = "";
  let subtotal = 0;

  for (const row of items) {
    const it = row.item || {};
    const qty = row.qty || 1;
    const unit = formatTLtoNumber(it.price);
    const lineTotal = qty * unit;
    subtotal += lineTotal;

    const k = keyOf(it);
    rows += `
      <tr data-key="${k}">
        <td>
          <div class="cart-item">
            <img src="${it.image}" alt="">
            <div>
              <div class="brand">${it.name || ""}</div>
              <div class="title"><a href="${
                it.link
              }" target="_blank" rel="noopener">${it.desc || "-"}</a></div>
            </div>
          </div>
        </td>
        <td>${it.price || "-"}</td>
        <td>
          <div class="qty-box">
            <button class="btn ghost dec">-</button>
            <input class="qty" type="number" min="0" value="${qty}"/>
            <button class="btn ghost inc">+</button>
          </div>
        </td>
        <td class="line-total">${numberToTL(lineTotal)}</td>
        <td><button class="remove-btn">Kaldır</button></td>
      </tr>
    `;
  }

  $("#cartBody").html(rows);
  $("#subTotal").text(numberToTL(subtotal));
  $("#grandTotal").text(numberToTL(subtotal)); // kargo 0

  // Event bindings
  // +/-
  $(".qty-box .inc")
    .off("click")
    .on("click", async function () {
      const tr = $(this).closest("tr");
      const key = tr.data("key");
      const inp = tr.find("input.qty");
      const val = Number(inp.val() || 0) + 1;
      inp.val(val);
      const cart = await updateQty(key, val);
      renderCart(cart);
    });
  $(".qty-box .dec")
    .off("click")
    .on("click", async function () {
      const tr = $(this).closest("tr");
      const key = tr.data("key");
      const inp = tr.find("input.qty");
      const val = Math.max(0, Number(inp.val() || 0) - 1);
      inp.val(val);
      const cart = await updateQty(key, val);
      renderCart(cart);
    });

  // direkt qty input
  $(".qty-box input.qty")
    .off("change")
    .on("change", async function () {
      const tr = $(this).closest("tr");
      const key = tr.data("key");
      let val = Number($(this).val() || 0);
      if (!Number.isFinite(val) || val < 0) val = 0;
      const cart = await updateQty(key, val);
      renderCart(cart);
    });

  // remove
  $(".remove-btn")
    .off("click")
    .on("click", async function () {
      const tr = $(this).closest("tr");
      const key = tr.data("key");
      const cart = await removeItem(key);
      renderCart(cart);
    });
}

$(async function () {
  try {
    await ensureCart();
    const cart = await getCart();
    renderCart(cart);
  } catch (e) {
    console.error(e);
    $("#cartEmpty").show().text("Sepet yüklenemedi.");
  }

  $("#clearCart").on("click", async function () {
    try {
      const cart = await clearCart();
      renderCart(cart);
    } catch (e) {
      console.error(e);
      alert("Sepet temizlenemedi.");
    }
  });

  $("#checkout").on("click", async function () {
    // Mock: temizle + mesaj
    try {
      await clearCart();
      alert("Ödeme başarılı (mock). Siparişiniz alındı.");
      window.location.href = "/index.html";
    } catch (e) {
      console.error(e);
      alert("Ödeme işlemi tamamlanamadı.");
    }
  });
});
