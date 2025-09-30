// web/app.js
const API_BASE = ""; // aynı origin (backend static servis ediyor)

let state = {
  category: null,
  q: "",
  minPrice: null,
  maxPrice: null,
  sort: "", // "price-asc" | "price-desc" | "name-asc" | "name-desc"
  page: 1,
  pageSize: 12,
  currentItems: [],
  allItemsCache: null,
};

let CART_ID = localStorage.getItem("cartify_cartId") || null;

/* ---------------- Cart helpers ---------------- */
async function ensureCart() {
  if (CART_ID) return CART_ID;
  const r = await fetch(`${API_BASE}/api/cart/init`, { method: "POST" });
  if (!r.ok) throw new Error("cart/init failed");
  const { cartId } = await r.json();
  CART_ID = cartId;
  localStorage.setItem("cartify_cartId", CART_ID);
  return CART_ID;
}

async function fetchCart() {
  await ensureCart();
  const r = await fetch(
    `${API_BASE}/api/cart?cartId=${encodeURIComponent(CART_ID)}`
  );
  if (!r.ok) throw new Error("get cart failed");
  return r.json();
}

async function addToCart(item, qty = 1) {
  await ensureCart();
  const r = await fetch(`${API_BASE}/api/cart/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartId: CART_ID, item, qty }),
  });
  if (!r.ok) throw new Error("add to cart failed");
  return r.json();
}

function updateCartBadge(count) {
  $("#cartBadge").text(count);
}

/* ---------------- Utils ---------------- */
function formatTL(str) {
  if (!str) return NaN;
  // "79,99 TL" -> 79.99
  const num = String(str)
    .replace(/\s*TL$/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(num);
  return Number.isFinite(n) ? n : NaN;
}

function sortItems(items) {
  const s = state.sort;
  if (!s) return items;
  const [key, dir] = s.split("-");
  const mul = dir === "asc" ? 1 : -1;
  const copy = items.slice();

  if (key === "price") {
    copy.sort((a, b) => (formatTL(a.price) - formatTL(b.price)) * mul);
  } else if (key === "name") {
    copy.sort(
      (a, b) =>
        (a.desc || "").localeCompare(b.desc || "", "tr", {
          sensitivity: "base",
        }) * mul
    );
  }
  return copy;
}

function applyFilters(items) {
  let out = items;
  const { q, minPrice, maxPrice } = state;

  if (q) {
    const needle = q.toLocaleLowerCase("tr");
    out = out.filter(
      (it) =>
        (it.desc || "").toLocaleLowerCase("tr").includes(needle) ||
        (it.name || "").toLocaleLowerCase("tr").includes(needle)
    );
  }

  if (minPrice)
    out = out.filter((it) => formatTL(it.price) >= Number(minPrice));
  if (maxPrice)
    out = out.filter((it) => formatTL(it.price) <= Number(maxPrice));
  return sortItems(out);
}

function paginate(items) {
  const { page, pageSize } = state;
  const start = (page - 1) * pageSize;
  return { total: items.length, slice: items.slice(start, start + pageSize) };
}

function renderGrid(items, total) {
  if (!Array.isArray(items)) items = [];

  if (total === 0) {
    $("#grid").html('<div class="results-info">Sonuç bulunamadı.</div>');
  } else {
    const html = items
      .map((it) => {
        const alt = (it.desc || it.name || "Ürün").replace(/"/g, "&quot;");
        return `
        <article class="card">
          <div class="thumb">
            <img src="${it.image}" alt="${alt}">
          </div>
          <div class="body">
            <div class="brand">${it.name || ""}</div>
            <div class="title">${it.desc || "-"}</div>
            <div class="price">${it.price || "-"}</div>
            <div class="actions">
              <button class="btn add-to-cart">Sepete Ekle</button>
              <a class="btn ghost" href="${
                it.link
              }" target="_blank" rel="noopener">İncele</a>
            </div>
          </div>
        </article>
      `;
      })
      .join("");
    $("#grid").html(html);
  }

  // Sadece "Sepete Ekle" butonuna bağlan
  $(".card button.add-to-cart")
    .off("click")
    .on("click", async function () {
      try {
        const root = $(this).closest(".card");
        const item = {
          desc: root.find(".title").text(),
          name: root.find(".brand").text(),
          price: root.find(".price").text(),
          image: root.find("img").attr("src"),
          link: root.find("a.btn.ghost").attr("href"),
        };
        const cart = await addToCart(item, 1);
        const totalQty = (cart.items || []).reduce(
          (s, x) => s + (x.qty || 0),
          0
        );
        updateCartBadge(totalQty);
      } catch (e) {
        console.error(e);
        alert("Sepete eklenemedi. Lütfen tekrar deneyin.");
      }
    });

  const start = total ? (state.page - 1) * state.pageSize + 1 : 0;
  const end = total ? Math.min(state.page * state.pageSize, total) : 0;
  $("#resultsInfo").text(
    total ? `${total} üründen ${start}–${end} arası gösteriliyor` : ""
  );
  $("#pageInfo").text(`Sayfa ${state.page}`);
  $("#prevPage").prop("disabled", state.page <= 1);
  $("#nextPage").prop("disabled", end >= total || total === 0);
}
/* ---------------- Data ---------------- */
async function getAllItemsFlattened() {
  if (!state.allItemsCache) {
    const res = await fetch(`${API_BASE}/api/all`);
    if (!res.ok) throw new Error("/api/all failed");
    const data = await res.json();
    state.allItemsCache = (data?.result || []).flatMap(
      (cat) => cat.items || []
    );
  }
  return state.allItemsCache;
}

async function refresh() {
  try {
    const baseItems = state.q
      ? await getAllItemsFlattened()
      : state.currentItems;
    const filtered = applyFilters(baseItems);
    const { total, slice } = paginate(filtered);
    renderGrid(slice, total);
  } catch (e) {
    console.error(e);
    $("#grid").html('<div class="results-info">Veri yüklenemedi.</div>');
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/all`);
    if (!res.ok) throw new Error("/api/all failed");
    const data = await res.json();
    const cats = (data.result || []).map((c) => c.category);

    $("#categoryList").html(
      cats
        .map((cat) => `<li><a href="#" data-cat="${cat}">${cat}</a></li>`)
        .join("")
    );

    if (cats.length) {
      $("#categoryList").find(`a[data-cat="${cats[0]}"]`).addClass("active");
      await selectCategory(cats[0]);
    }

    $("#categoryList a")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();
        const cat = $(this).data("cat");
        $("#categoryList a").removeClass("active");
        $(this).addClass("active");
        selectCategory(cat);
      });
  } catch (e) {
    console.error(e);
    $("#grid").html('<div class="results-info">Kategori yüklenemedi.</div>');
  }
}

async function selectCategory(cat) {
  try {
    state.category = cat;
    state.page = 1;
    const res = await fetch(
      `${API_BASE}/api/category/${encodeURIComponent(cat)}`
    );
    if (!res.ok) throw new Error("/api/category failed");
    const data = await res.json();
    state.currentItems = data?.result?.items || [];
    refresh();
  } catch (e) {
    console.error(e);
    $("#grid").html('<div class="results-info">Ürünler yüklenemedi.</div>');
  }
}

/* ---------------- Init ---------------- */
$(function () {
  // sepet rozeti
  ensureCart()
    .then(fetchCart)
    .then((cart) => {
      const totalQty = (cart.items || []).reduce((s, x) => s + (x.qty || 0), 0);
      updateCartBadge(totalQty);
    })
    .catch(console.error);

  // arama
  $("#searchForm").on("submit", function (e) {
    e.preventDefault();
    state.q = $("#q").val().trim();
    state.page = 1;
    refresh();
  });

  // filtreler
  $("#applyFilters").on("click", function () {
    state.minPrice = $("#minPrice").val() || null;
    state.maxPrice = $("#maxPrice").val() || null;
    state.sort = $("#sort").val();
    state.page = 1;
    refresh();
  });

  $("#resetFilters").on("click", function () {
    $("#minPrice,#maxPrice").val("");
    $("#sort").val("");
    $("#q").val("");
    state.q = "";
    state.minPrice = null;
    state.maxPrice = null;
    state.sort = "";
    state.page = 1;
    refresh();
  });

  // sayfalama
  $("#prevPage").on("click", function () {
    if (state.page > 1) {
      state.page--;
      refresh();
    }
  });
  $("#nextPage").on("click", function () {
    state.page++;
    refresh();
  });

  // kategoriler
  loadCategories();
});
