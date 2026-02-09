import { API_BASE_URL, API_ENDPOINT } from '../constants';
import { CustomerPredictionRequest, CustomerPredictionResponse, PredictionFeatures } from '../types';

export const predictCustomerValue = async (
  customerId: string,
  features: PredictionFeatures
): Promise<CustomerPredictionResponse> => {
  const url = `${API_BASE_URL}${API_ENDPOINT}`;

  // Transform object to ordered array as required by backend:
  // [total_spend, avg_spend, num_transactions, total_units, unique_products, recency_days]
  const featureArray = [
    features.total_spend,
    features.avg_spend,
    features.num_transactions,
    features.total_units,
    features.unique_products,
    features.recency_days
  ];

  const payload: CustomerPredictionRequest = {
    customer_id: customerId,
    features: featureArray
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.statusText}`);
    }

    const data: CustomerPredictionResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Prediction service error:", error);
    throw error;
  }
};