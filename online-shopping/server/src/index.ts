import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { findProduct, listProducts } from "./products.js";

const app = express();
app.use(cors());

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, port: config.port });
});

app.get("/api/products", async (_req, res) => {
  await sleep(320);
  const products = listProducts();

  res.json({
    products,
    meta: {
      total: products.length,
      fetchedAt: new Date().toISOString(),
    },
  });
});

app.get("/api/products/:productId", async (req, res) => {
  await sleep(520);

  const product = findProduct(req.params.productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    product,
    meta: {
      fetchedAt: new Date().toISOString(),
    },
  });
});

app.listen(config.port, () => {
  process.stderr.write(
    `online-shopping server http://127.0.0.1:${config.port}\n` +
      "  GET /api/products\n" +
      "  GET /api/products/:productId\n"
  );
});
