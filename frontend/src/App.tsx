import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import type { Product, WatchRule, AgentDecision, PricePoint } from "./api";
import NewRuleForm from "./components/NewRuleForm";
import RuleCard from "./components/RuleCard";
import DecisionLog from "./components/DecisionLog";

const POLL_MS = 4000;

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rules, setRules] = useState<WatchRule[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [histories, setHistories] = useState<Record<number, PricePoint[]>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, r, d] = await Promise.all([
        api.getProducts(),
        api.getRules(),
        api.getDecisions(),
      ]);
      setProducts(p);
      setRules(r);
      setDecisions(d);
      setError(null);

      const histEntries = await Promise.all(
        r.map(async (rule) => [rule.product_id, await api.getHistory(rule.product_id)] as const)
      );
      setHistories(Object.fromEntries(histEntries));
    } catch (err) {
      setError("Can't reach the backend. Is it running on http://localhost:4000?");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">DealHunter AI</h1>
          <p className="text-slate-500 text-sm">
            Autonomous agent tracking prices, deciding, and acting within your budget guardrails.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-slate-700">Watched Products</h2>
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                history={histories[rule.product_id] ?? []}
                onChanged={refresh}
              />
            ))}
            {!rules.length && (
              <p className="text-sm text-slate-400">No watch rules yet — create one to the right.</p>
            )}
          </div>

          <div className="space-y-6">
            <NewRuleForm products={products} onCreated={refresh} />

            <div>
              <h2 className="font-semibold text-slate-700 mb-2">Agent Decision Log</h2>
              <DecisionLog decisions={decisions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
