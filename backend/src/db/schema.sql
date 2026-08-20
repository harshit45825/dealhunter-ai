-- DealHunter AI schema
-- Single-demo-user setup: no auth table, keep it simple for the hackathon.

DROP TABLE IF EXISTS agent_decisions;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS watch_rules;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,      -- starting/reference price for the mock feed
  current_price NUMERIC(10, 2) NOT NULL,   -- latest simulated price
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE watch_rules (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price NUMERIC(10, 2) NOT NULL,    -- buy/notify if price <= this
  budget_cap NUMERIC(10, 2) NOT NULL,      -- hard ceiling, agent must never exceed this
  auto_buy BOOLEAN NOT NULL DEFAULT false, -- false = notify only, true = agent can "purchase"
  status TEXT NOT NULL DEFAULT 'active',   -- active | fulfilled | cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_decisions (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER NOT NULL REFERENCES watch_rules(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_at_decision NUMERIC(10, 2) NOT NULL,
  action TEXT NOT NULL,        -- 'notify' | 'purchase' | 'skip'
  reasoning TEXT NOT NULL,     -- Claude's explanation, shown live in the UI
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_history_product ON price_history(product_id, recorded_at DESC);
CREATE INDEX idx_agent_decisions_rule ON agent_decisions(rule_id, created_at DESC);
