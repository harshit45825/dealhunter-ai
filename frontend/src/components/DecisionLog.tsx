import type { AgentDecision } from "../api";

const ACTION_STYLES: Record<string, string> = {
  purchase: "bg-emerald-100 text-emerald-700 border-emerald-300",
  notify: "bg-amber-100 text-amber-700 border-amber-300",
  skip: "bg-slate-100 text-slate-600 border-slate-300",
};

const ACTION_LABEL: Record<string, string> = {
  purchase: "PURCHASED",
  notify: "NOTIFIED USER",
  skip: "SKIPPED",
};

export default function DecisionLog({ decisions }: { decisions: AgentDecision[] }) {
  if (!decisions.length) {
    return (
      <div className="text-sm text-slate-400 py-8 text-center">
        No agent decisions yet. Once a tracked price hits a target, the agent's
        reasoning will appear here in real time.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map((d) => (
        <div
          key={d.id}
          className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-slate-800">{d.product_name}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ACTION_STYLES[d.action]}`}
            >
              {ACTION_LABEL[d.action] ?? d.action.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-600">{d.reasoning}</p>
          <div className="text-xs text-slate-400 mt-1">
            ${d.price_at_decision} · {new Date(d.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
