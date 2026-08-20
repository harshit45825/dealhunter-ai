import { useState } from "react";
import type { Product } from "../api";
import { api } from "../api";

export default function NewRuleForm({
  products,
  onCreated,
}: {
  products: Product[];
  onCreated: () => void;
}) {
  const [productId, setProductId] = useState<number | "">("");
  const [target, setTarget] = useState("");
  const [budget, setBudget] = useState("");
  const [autoBuy, setAutoBuy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!productId || !target || !budget) {
      setError("All fields are required.");
      return;
    }
    if (Number(target) > Number(budget)) {
      setError("Target price can't exceed the budget cap.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createRule({
        product_id: Number(productId),
        target_price: Number(target),
        budget_cap: Number(budget),
        auto_buy: autoBuy,
      });
      setTarget("");
      setBudget("");
      setAutoBuy(false);
      onCreated();
    } catch (err) {
      setError("Failed to create rule.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">New Watch Rule</h3>

      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
      >
        <option value="">Select a product…</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} (current: ${p.current_price})
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Target price ($)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-1/2 border border-slate-300 rounded px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          placeholder="Budget cap ($)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-1/2 border border-slate-300 rounded px-2 py-1.5 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={autoBuy}
          onChange={(e) => setAutoBuy(e.target.checked)}
        />
        Enable auto-buy (agent purchases automatically; otherwise it only notifies)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Watch Rule"}
      </button>
    </form>
  );
}
