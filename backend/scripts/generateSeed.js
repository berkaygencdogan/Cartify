// backend/scripts/generateSeed.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  // Giyim
  "Giyim",
  "Elbise",
  "Tişört",
  "Gömlek",
  "Kot Pantolon",
  "Kot Ceket",
  "Pantolon",
  "Mont",
  "Bluz",
  "Ceket",
  "Etek",
  "Kazak",
  "Tesettür",
  "Büyük Beden",
  "Trençkot",
  "Yağmurluk & Rüzgarlık",
  "Sweatshirt",
  "Kaban",
  "Hırka",
  "Palto",
  // Ayakkabı
  "Ayakkabı",
  "Topuklu Ayakkabı",
  "Sneaker",
  "Günlük Ayakkabı",
  "Babet",
  "Sandalet",
  "Bot",
  "Çizme",
  "Kar Botu",
  "Loafer",
  // Aksesuar & Çanta
  "Aksesuar & Çanta",
  "Çanta",
  "Saat",
  "Takı",
  "Cüzdan",
  "Atkı",
  "Bere",
  "Eldiven",
  "Kemer",
  "Şal",
  "Omuz Çantası",
  "Sırt Çantası",
  "Bel Çantası",
  "Okul Çantası",
  "Laptop Çantası",
  "Portföy",
  "Postacı Çantası",
  "El Çantası",
  "Kanvas Çanta",
  "Makyaj Çantası",
  "Abiye Çanta",
  "Çapraz Çanta",
  "Bez Çanta",
  "Anne Bebek Çantası",
  "Evrak Çantası",
  "Tote Çanta",
  "Beslenme Çantası",
  "Kartlık",
  // Ev & İç Giyim
  "Ev & İç Giyim",
  "Pijama Takımı",
  "Gecelik",
  "Sütyen",
  "İç Çamaşırı Takımları",
  "Fantezi Giyim",
  "Çorap",
  "Korse",
  "Külot",
  "Büstiyer",
  "Bralet",
  "Atlet & Body",
  "Kombinezon",
  "Jartiyer",
  // Kozmetik
  "Kozmetik",
  "Parfüm",
  "Göz Makyajı",
  "Cilt Bakım",
  "Saç Bakımı",
  "Makyaj",
  "Ağız Bakım",
  "Cinsel Sağlık",
  "Vücut Bakım",
  "Hijyenik Ped",
  "Duş Jeli & Kremleri",
  "Epilasyon Ürünleri",
  "Ruj",
  "Dudak Nemlendirici",
  "Aydınlatıcı & Highlighter",
  "Eyeliner",
  "Ten Makyajı",
  "Manikür & Pedikür",
  "BB & CC Krem",
  "El Kremi",
  "Yüz Nemlendirici",
  // Spor & Outdoor
  "Spor & Outdoor",
  "Spor Sütyeni",
  "Tayt",
  "Eşofman",
  "Koşu Ayakkabısı",
  "Spor Çantası",
  "Spor Ekipmanları",
  "Outdoor Ayakkabı",
  "Outdoor Ekipmanları",
  "Sporcu Besinleri",
  "Sporcu Aksesuarları",
  "Outdoor Çanta",
  "Kayak Malzemeleri",
  "Uyku Tulumu",
  "Mat",
  "Dağcılık",
  "Kadın Spor Ceket",
  "Spor Ayakkabı",
];

const BRANDS = [
  "TRENDYOLMİLLA",
  "Mavi",
  "LC Waikiki",
  "Koton",
  "adidas",
  "Nike",
  "Puma",
  "Derimod",
  "Vakko",
  "Pull&Bear",
];
const LOREM = [
  "Şık tasarım",
  "Günlük kullanım için ideal",
  "Rahat kesim",
  "Yumuşak doku",
  "Mevsimlik kullanım",
  "Dayanıklı kumaş",
  "Modern görünüm",
  "Hafif yapı",
  "Nefes alır",
  "Esnek yapı",
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function priceTL(min = 69, max = 899) {
  const whole = rand(min, max);
  const frac = ["99", "49", "90"][rand(0, 2)];
  return `${whole},${frac} TL`;
}
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9ğüşöçıİı\- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function makeItem(cat, i) {
  const brand = BRANDS[rand(0, BRANDS.length - 1)];
  const title = `${cat} ${i + 1}`;
  const desc = `${LOREM[rand(0, LOREM.length - 1)]}, ${LOREM[
    rand(0, LOREM.length - 1)
  ].toLowerCase()}`;
  const seed = slugify(`${cat}-${i + 1}`);
  return {
    image: `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`,
    name: brand,
    desc: title + " - " + desc,
    newprice: "",
    price: priceTL(),
    link: `https://example.com/${slugify(cat)}/${slugify(title)}`,
  };
}

function makeCategory(cat) {
  const items = Array.from({ length: 10 }, (_, i) => makeItem(cat, i));
  return { category: cat, items };
}

const result = CATEGORIES.map(makeCategory);
const payload = { success: true, result };

const outPath = path.join(__dirname, "..", "src", "data", "products.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload), "utf8");
console.log("✓ products.json yazıldı:", outPath);
