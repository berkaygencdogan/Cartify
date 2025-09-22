import axios from "axios";
import { mapToProduct } from "../mappers/productMapper.js";

const BASE = "https://api.collectapi.com";

export async function searchCollectApi({
  q,
  source = "trendyol",
  limit = 20,
  page = 1,
}) {
  const key = process.env.COLLECTAPI_KEY;
  if (!key) throw new Error("COLLECTAPI_KEY missing");

  const params = {
    "data.query": q || "",
    "data.source": source,
  };

  const res = await axios.get(`${BASE}/shopping/search`, {
    headers: {
      "content-type": "application/json",
      authorization: key,
    },
    params,
  });

  // Beklenen yanıt yapısı farklılık gösterebilir; en yaygın alanları ele alalım:
  const rawItems =
    res.data?.result ??
    res.data?.products ??
    res.data?.data ??
    res.data?.items ??
    [];

  const items = rawItems.map((item) =>
    mapToProduct({ ...item, source: "collectapi" })
  );

  // sayfalama CollectAPI tarafında olmayabilir; biz sınırlayalım
  const start = (Number(page) - 1) * Number(limit);
  const sliced = items.slice(start, start + Number(limit));

  return {
    page: Number(page),
    limit: Number(limit),
    total: items.length,
    count: sliced.length,
    items: sliced,
  };
}
