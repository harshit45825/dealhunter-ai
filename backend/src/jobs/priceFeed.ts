import { pool } from "../db/pool";

/**
 * Mock price feed. Each tick, every product's price moves slightly.
 * Random walk with a *slight downward drift* so prices trend toward
 * targets over time -- important for live demos so you're not waiting
 * on pure chance to see the agent fire.
 *
 * Call forcePriceDrop() (wired to a manual API endpoint) if you want
 * to guarantee a price crosses a target right when you're demoing.
 */

const DRIFT = -0.003; // ~0.3% average downward drift per tick
const VOLATILITY = 0.015; // +/- 1.5% random noise per tick

export async function tickPrices() {
  const { rows: products } = await pool.query(
    `SELECT id, current_price FROM products`
  );

  for (const product of products) {
    const price = parseFloat(product.current_price);
    const noise = (Math.random() * 2 - 1) * VOLATILITY;
    const change = price * (DRIFT + noise);
    let newPrice = Math.max(price + change, price * 0.5); // never crash below 50% of last price
    newPrice = Math.round(newPrice * 100) / 100;

    await pool.query(`UPDATE products SET current_price = $1 WHERE id = $2`, [
      newPrice,
      product.id,
    ]);
    await pool.query(
      `INSERT INTO price_history (product_id, price) VALUES ($1, $2)`,
      [product.id, newPrice]
    );
  }
}

/** Manually force a product's price down toward a target -- for demo control. */
export async function forcePriceDrop(productId: number, newPrice: number) {
  await pool.query(`UPDATE products SET current_price = $1 WHERE id = $2`, [
    newPrice,
    productId,
  ]);
  await pool.query(
    `INSERT INTO price_history (product_id, price) VALUES ($1, $2)`,
    [productId, newPrice]
  );
}
