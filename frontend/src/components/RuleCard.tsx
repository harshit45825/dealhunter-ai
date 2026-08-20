import type { PricePoint, WatchRule } from "../api";
import { api } from "../api";
import PriceChart from "./PriceChart";

export default function RuleCard({
  rule,
  history,
  onChanged,
}: {
  rule: WatchRule;
  history: PricePoint[];
  onChanged: () => void;
}) {
  const current = parseFloat(rule.current_price);
  const target = parseFloat(rule.target_price);
  const met = current <= target;

  async function toggleAutoBuy() {
    await api.patchRule(rule.id, { auto_buy: !rule.auto_buy });
    onChanged();
  }

  async function forceTriggerDemo() {
    // Nudges the price just under target so you can trigger the agent live during a demo.
    await api.forcePrice(rule.product_id, target - 1);
    onChanged();
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-slate-800">{rule.product_name}</h4>
          <p className="text-xs text-slate-500">
            Target ${rule.target_price} · Budget cap ${rule.budget_cap}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            rule.status === "fulfilled"
              ? "bg-emerald-100 text-emerald-700"
              : met
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {rule.status === "fulfilled" ? "FULFILLED" : met ? "TARGET MET" : "WATCHING"}
        </span>
      </div>

      <PriceChart data={history} />

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm">
          <span className="text-slate-500">Current: </span>
          <span className="font-semibold text-slate-800">${rule.current_price}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleAutoBuy}
            className={`text-xs px-2 py-1 rounded border ${
              rule.auto_buy
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-slate-50 border-slate-300 text-slate-600"
            }`}
          >
            {rule.auto_buy ? "Auto-buy: ON" : "Auto-buy: OFF"}
          </button>
          {rule.status === "active" && (
            <button
              onClick={forceTriggerDemo}
              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              title="Demo helper: nudges price under target"
            >
              Trigger for demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
