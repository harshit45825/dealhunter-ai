import express from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import apiRoutes from "./routes/api";
import { tickPrices } from "./jobs/priceFeed";
import { runAgentCycle } from "./agent/dealAgent";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

const PRICE_TICK_MS = Number(process.env.PRICE_TICK_INTERVAL_MS) || 5000;
const AGENT_TICK_MS = Number(process.env.AGENT_TICK_INTERVAL_MS) || 7000;

app.listen(PORT, () => {
  console.log(`DealHunter AI backend running on port ${PORT}`);

  // Mock price feed: ticks on an interval (not cron syntax, since we want
  // sub-minute granularity for a live demo).
  setInterval(() => {
    tickPrices().catch((err) => console.error("Price tick failed:", err));
  }, PRICE_TICK_MS);

  // Agent evaluation loop.
  setInterval(() => {
    runAgentCycle().catch((err) => console.error("Agent cycle failed:", err));
  }, AGENT_TICK_MS);

  console.log(
    `Price feed every ${PRICE_TICK_MS}ms, agent evaluation every ${AGENT_TICK_MS}ms`
  );
});
