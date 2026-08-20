import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { pool } from "../db/pool";

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RuleRow {
  id: number;
  product_id: number;
  target_price: string;
  budget_cap: string;
  auto_buy: boolean;
  status: string;
  product_name: string;
  current_price: string;
}

/**
 * Core agent loop. For each active rule, checks whether the current price
 * satisfies the rule. If so, asks Claude to produce a short, human-readable
 * justification and confirm the action -- this is the "agentic" part: the
 * agent reasons about the decision rather than a bare if-statement, and the
 * reasoning is what gets shown in the live decision log during the demo.
 */
export async function runAgentCycle() {
  const { rows: rules } = await pool.query<RuleRow>(
    `SELECT wr.id, wr.product_id, wr.target_price, wr.budget_cap, wr.auto_buy, wr.status,
            p.name AS product_name, p.current_price
     FROM watch_rules wr
     JOIN products p ON p.id = wr.product_id
     WHERE wr.status = 'active'`
  );

  for (const rule of rules) {
    const currentPrice = parseFloat(rule.current_price);
    const targetPrice = parseFloat(rule.target_price);
    const budgetCap = parseFloat(rule.budget_cap);

    if (currentPrice > targetPrice) {
      continue; // no action needed this tick, don't spam decisions
    }

    // Safety guardrail: never act above the budget cap, regardless of what
    // the model says. This is enforced in code, not left to the LLM.
    const withinBudget = currentPrice <= budgetCap;

    const decision = await getAgentDecision({
      productName: rule.product_name,
      currentPrice,
      targetPrice,
      budgetCap,
      autoBuy: rule.auto_buy,
      withinBudget,
    });

    await pool.query(
      `INSERT INTO agent_decisions (rule_id, product_id, price_at_decision, action, reasoning)
       VALUES ($1, $2, $3, $4, $5)`,
      [rule.id, rule.product_id, currentPrice, decision.action, decision.reasoning]
    );

    if (decision.action === "purchase") {
      await pool.query(`UPDATE watch_rules SET status = 'fulfilled' WHERE id = $1`, [
        rule.id,
      ]);
    }
  }
}

async function getAgentDecision(params: {
  productName: string;
  currentPrice: number;
  targetPrice: number;
  budgetCap: number;
  autoBuy: boolean;
  withinBudget: boolean;
}): Promise<{ action: "purchase" | "notify" | "skip"; reasoning: string }> {
  const { productName, currentPrice, targetPrice, budgetCap, autoBuy, withinBudget } =
    params;

  // Hard guardrail enforced before the model is even asked -- code, not a prompt.
  if (!withinBudget) {
    return {
      action: "skip",
      reasoning: `Price of $${currentPrice} is under the target but exceeds the hard budget cap of $${budgetCap}. Skipping to respect the user's spending limit.`,
    };
  }

  const prompt = `You are a shopping agent monitoring prices on behalf of a user.

Product: ${productName}
Current price: $${currentPrice}
User's target price: $${targetPrice}
User's budget cap (hard limit): $${budgetCap}
Auto-buy enabled: ${autoBuy}

The price has met or beaten the target and is within budget. Decide the action:
- If auto-buy is enabled, the action is "purchase".
- If auto-buy is disabled, the action is "notify" (alert the user, don't buy).

Respond in this exact format, nothing else:
ACTION: <purchase|notify>
REASONING: <one or two sentences explaining the decision to the user, mention the price, target, and savings>`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("\n");

  const actionMatch = text.match(/ACTION:\s*(purchase|notify)/i);
  const reasoningMatch = text.match(/REASONING:\s*(.+)/is);

  const action = (actionMatch?.[1]?.toLowerCase() as "purchase" | "notify") ??
    (autoBuy ? "purchase" : "notify");
  const reasoning =
    reasoningMatch?.[1]?.trim() ??
    `Price hit $${currentPrice}, meeting the $${targetPrice} target within the $${budgetCap} budget.`;

  return { action, reasoning };
}
