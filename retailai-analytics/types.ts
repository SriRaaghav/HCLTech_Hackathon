export interface PredictionFeatures {
  total_spend: number;
  avg_spend: number;
  num_transactions: number;
  total_units: number;
  unique_products: number;
  recency_days: number;
}

export interface CustomerPredictionRequest {
  customer_id: string;
  features: number[]; // Expecting strictly ordered array
}

export interface CustomerPredictionResponse {
  customer_id: string;
  predicted_future_spend_30d: number;
  purchase_probability_30d: number;
  customer_segment: string;
  insight: string;
  recommended_action: string;
}

export enum SegmentType {
  LOW = 'Low Value',
  MEDIUM = 'Medium Value',
  HIGH = 'High Value'
}