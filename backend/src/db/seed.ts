import fs from "fs";
import path from "path";
import { pool } from "./pool";

async function seed() {
  const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schemaSql);
  console.log("Schema created.");

  // Demo products — scripted base prices so the mock feed has room to move.
  const products = [
    { name: "Sony WH-1000XM5 Headphones", base_price: 349.99 },
    { name: "iPad Air (5th Gen)", base_price: 599.0 },
    { name: "Instant Pot Duo 6-Qt", base_price: 89.99 },
  ];

  const productIds: number[] = [];
  for (const p of products) {
    const res = await pool.query(
      `INSERT INTO products (name, base_price, current_price) VALUES ($1, $2, $2) RETURNING id`,
      [p.name, p.base_price]
    );
    productIds.push(res.rows[0].id);
  }
  console.log(`Seeded ${productIds.length} products.`);

  // Demo watch rules — one auto-buy, one notify-only, so the demo shows both behaviors.
  await pool.query(
    `INSERT INTO watch_rules (product_id, target_price, budget_cap, auto_buy)
     VALUES ($1, $2, $3, $4)`,
    [productIds[0], 299.0, 320.0, true] // headphones: auto-buy under $299
  );
  await pool.query(
    `INSERT INTO watch_rules (product_id, target_price, budget_cap, auto_buy)
     VALUES ($1, $2, $3, $4)`,
    [productIds[1], 499.0, 520.0, false] // iPad: notify only under $499
  );

  console.log("Seeded demo watch rules. Ready to run `npm run dev`.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
