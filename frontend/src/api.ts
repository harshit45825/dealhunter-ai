import axios from "axios";

const API_BASE = "http://localhost:4000/api";

export interface Product {
  id: number;
  name: string;
  base_price: string;
  current_price: string;
}

export interface WatchRule {
  id: number;
  product_id: number;
  product_name: string;
  current_price: string;
  target_price: string;
  budget_cap: string;
  auto_buy: boolean;
  status: string;
  created_at: string;
}

export interface AgentDecision {
  id: number;
  rule_id: number;
  product_id: number;
  product_name: string;
  price_at_decision: string;
  action: "purchase" | "notify" | "skip";
  reasoning: string;
  created_at: string;
}

export interface PricePoint {
  price: string;
  recorded_at: string;
}

export const api = {
  getProducts: () => axios.get<Product[]>(`${API_BASE}/products`).then((r) => r.data),
  getHistory: (productId: number) =>
    axios.get<PricePoint[]>(`${API_BASE}/products/${productId}/history`).then((r) => r.data),
  forcePrice: (productId: number, price: number) =>
    axios.post(`${API_BASE}/products/${productId}/force-price`, { price }),
  getRules: () => axios.get<WatchRule[]>(`${API_BASE}/rules`).then((r) => r.data),
  createRule: (payload: {
    product_id: number;
    target_price: number;
    budget_cap: number;
    auto_buy: boolean;
  }) => axios.post<WatchRule>(`${API_BASE}/rules`, payload).then((r) => r.data),
  patchRule: (id: number, payload: Partial<{ auto_buy: boolean; status: string }>) =>
    axios.patch<WatchRule>(`${API_BASE}/rules/${id}`, payload).then((r) => r.data),
  deleteRule: (id: number) => axios.delete(`${API_BASE}/rules/${id}`),
  getDecisions: () =>
    axios.get<AgentDecision[]>(`${API_BASE}/decisions`).then((r) => r.data),
};
