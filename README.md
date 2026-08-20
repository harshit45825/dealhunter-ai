# DealHunter AI — Autonomous Shopping Agent

**Track:** AI Growth & Agentic Commerce

An AI agent that watches prices on products you care about and **acts** on your behalf —
either notifying you or autonomously purchasing — the moment a deal meets rules you set
(target price, hard budget cap). Built to demonstrate agentic commerce: the model doesn't
just recommend, it reasons about a decision and executes within guardrails you control.

## Why this fits the track

Manual deal-hunting is a background chore that costs time and misses fast-moving deals.
DealHunter compresses that into an autonomous loop: a scripted mock price feed simulates
real market movement, and on every tick an agent evaluates active rules, uses Claude to
produce a short human-readable justification, and either **purchases** (if auto-buy is on),
**notifies** (if it's off), or **skips** (if the budget guardrail is violated — enforced in
code, not left to the model). Every decision is logged and shown live, which is the core of
what makes this "agentic" rather than just a price tracker.

## Architecture

```
frontend/   React + Vite + TypeScript + Tailwind + Recharts
            Dashboard: watch rules, live price charts, agent decision feed

backend/    Node.js + Express + TypeScript
            REST API + two background loops:
              - priceFeed.ts   mock price simulator (random walk + downward drift)
              - dealAgent.ts   evaluates rules, calls Claude API, logs decisions

            PostgreSQL: products, watch_rules, price_history, agent_decisions
```

**Guardrail design:** the budget cap check happens in application code *before* the model
is even called — the agent can reason about *how* to explain a purchase, but it can never
be talked into exceeding the user's hard limit. Worth calling out to judges as a deliberate
safety pattern for agentic commerce, not just an implementation detail.

## Setup

### 1. Database
```bash
createdb dealhunter
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL and ANTHROPIC_API_KEY
npm install
npm run seed   # creates schema + demo products/rules
npm run dev    # starts API on :4000, price feed + agent loops begin ticking
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev    # starts on :5173
```

Open http://localhost:5173. Within a few ticks (5–7s intervals) you'll see prices moving
on the chart and, once a price crosses a rule's target, a reasoned decision appear in the
log.

## Demo tips

- Each `RuleCard` has a **"Trigger for demo"** button that nudges a product's price just
  under its target — use this live instead of waiting on the random walk, so the agent
  fires on cue.
- The seed data ships with one **auto-buy** rule (headphones) and one **notify-only** rule
  (iPad) so you can show both agent behaviors in one pass.
- Point out the decision log's reasoning text — that's Claude explaining *why* it acted,
  not a canned string, which is the most interview/judge-worthy detail here.

## Possible extensions (if time allows)
- Real price scraping for 1–2 retailers instead of the mock feed
- Stripe test-mode "purchase" instead of a simulated one
- Multi-user accounts (currently single demo user, matching the Event Ticketing project's
  earlier iteration before auth was added)
