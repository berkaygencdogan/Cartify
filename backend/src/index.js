import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// JSON dosyasını oku
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API çalışıyor: http://localhost:${PORT}`));
