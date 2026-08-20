import { Router } from "express";
import { pool } from "../db/pool";
import { forcePriceDrop } from "../jobs/priceFeed";

const router = Router();

// --- Products ---
router.get("/products", async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, base_price, current_price FROM products ORDER BY id`
  );
  res.json(rows);
});

router.get("/products/:id/history", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT price, recorded_at FROM price_history
     WHERE product_id = $1 ORDER BY recorded_at ASC LIMIT 200`,
    [req.params.id]
  );
  res.json(rows);
});

// Demo control: force a product's price down so you can trigger the agent live.
router.post("/products/:id/force-price", async (req, res) => {
  const { price } = req.body;
  if (typeof price !== "number") {
    return res.status(400).json({ error: "price (number) is required" });
  }
  await forcePriceDrop(Number(req.params.id), price);
  res.json({ ok: true });
});

// --- Watch rules ---
router.get("/rules", async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT wr.*, p.name AS product_name, p.current_price
     FROM watch_rules wr
     JOIN products p ON p.id = wr.product_id
     ORDER BY wr.created_at DESC`
  );
  res.json(rows);
});

router.post("/rules", async (req, res) => {
  const { product_id, target_price, budget_cap, auto_buy } = req.body;
  if (!product_id || target_price == null || budget_cap == null) {
    return res
      .status(400)
      .json({ error: "product_id, target_price, and budget_cap are required" });
  }
  if (Number(target_price) > Number(budget_cap)) {
    return res
      .status(400)
      .json({ error: "target_price cannot exceed budget_cap" });
  }
  const { rows } = await pool.query(
    `INSERT INTO watch_rules (product_id, target_price, budget_cap, auto_buy)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [product_id, target_price, budget_cap, !!auto_buy]
  );
  res.status(201).json(rows[0]);
});

router.patch("/rules/:id", async (req, res) => {
  const { auto_buy, status } = req.body;
  const { rows } = await pool.query(
    `UPDATE watch_rules SET
       auto_buy = COALESCE($1, auto_buy),
       status = COALESCE($2, status)
     WHERE id = $3 RETURNING *`,
    [auto_buy, status, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "Rule not found" });
  res.json(rows[0]);
});

router.delete("/rules/:id", async (req, res) => {
  await pool.query(`DELETE FROM watch_rules WHERE id = $1`, [req.params.id]);
  res.status(204).send();
});

// --- Agent decisions (the live log) ---
router.get("/decisions", async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT ad.*, p.name AS product_name
     FROM agent_decisions ad
     JOIN products p ON p.id = ad.product_id
     ORDER BY ad.created_at DESC LIMIT 50`
  );
  res.json(rows);
});

export default router;
