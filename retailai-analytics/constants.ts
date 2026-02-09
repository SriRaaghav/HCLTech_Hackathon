export const API_BASE_URL = "https://hcl-hack.onrender.com";
export const API_ENDPOINT = "/predict_customer_value";

// The backend expects features in this specific order:
// [total_spend, avg_spend, num_transactions, total_units, unique_products, recency_days]
export const FEATURE_LABELS = {
  total_spend: "Total Spend ($)",
  avg_spend: "Avg Spend per Txn ($)",
  num_transactions: "Number of Transactions",
  total_units: "Total Units Purchased",
  unique_products: "Unique Products",
  recency_days: "Days Since Last Purchase"
};