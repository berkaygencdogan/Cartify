import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";
import {
  createCart,
  getCart,
  addItem,
  updateQty,
  removeItem,
  clearCart,
} from "./cart.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const dataPath = path.join(__dirname, "data", "products.json");
const PRODUCTS = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Tüm ürünler
app.get("/api/all", (req, res) => {
  res.json(PRODUCTS);
});

// Belirli kategori (ör: /api/category/Kazak)
app.get("/api/category/:name", (req, res) => {
  const { name } = req.params;
  const category = PRODUCTS.result.find(
    (c) => c.category.toLowerCase() === name.toLowerCase()
  );
  if (!category)
    return res.status(404).json({ success: false, message: "Kategori yok" });
  res.json({ success: true, result: category });
});

// Cart init: yeni cartId ver
app.post("/api/cart/init", (_req, res) => {
  const cartId = createCart();
  res.json({ cartId });
});

// Cart görüntüle
app.get("/api/cart", (req, res) => {
  const { cartId } = req.query;
  if (!cartId) return res.status(400).json({ error: "cartId missing" });
  res.json(getCart(cartId));
});

// Sepete ekle
app.post("/api/cart/add", (req, res) => {
  const { cartId, item, qty = 1 } = req.body || {};
  if (!cartId || !item)
    return res.status(400).json({ error: "cartId or item missing" });
  const cart = addItem(cartId, item, Number(qty));
  res.json(cart);
});

// Adet güncelle
app.post("/api/cart/update", (req, res) => {
  const { cartId, key, qty } = req.body || {};
  if (!cartId || !key || qty == null)
    return res.status(400).json({ error: "cartId, key, qty required" });
  const cart = updateQty(cartId, key, Number(qty));
  res.json(cart);
});

// Ürün çıkar
app.post("/api/cart/remove", (req, res) => {
  const { cartId, key } = req.body || {};
  if (!cartId || !key)
    return res.status(400).json({ error: "cartId, key required" });
  const cart = removeItem(cartId, key);
  res.json(cart);
});

// Temizle
app.post("/api/cart/clear", (req, res) => {
  const { cartId } = req.body || {};
  if (!cartId) return res.status(400).json({ error: "cartId required" });
  const cart = clearCart(cartId);
  res.json(cart);
});

const PORT = process.env.PORT || 4000;

// web klasörünü servis et
app.use(express.static(path.join(__dirname, "../../web")));

app.listen(PORT, () => console.log(`API çalışıyor: http://localhost:${PORT}`));
