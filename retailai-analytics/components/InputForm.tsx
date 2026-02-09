import React, { useState } from 'react';
import { PredictionFeatures } from '../types';
import { FEATURE_LABELS } from '../constants';
import { Calculator, ShoppingBag, CreditCard, Layers, Clock, Hash, ArrowRight, Loader2 } from 'lucide-react';

interface InputFormProps {
  isLoading: boolean;
  onSubmit: (id: string, features: PredictionFeatures) => void;
}

const InputForm: React.FC<InputFormProps> = ({ isLoading, onSubmit }) => {
  const [customerId, setCustomerId] = useState<string>('CUST-1001');
  const [features, setFeatures] = useState<PredictionFeatures>({
    total_spend: 1250.50,
    avg_spend: 85.00,
    num_transactions: 15,
    total_units: 45,
    unique_products: 12,
    recency_days: 5
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFeatures(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(customerId, features);
  };

  // Helper to render input fields with icons
  const renderInput = (
    key: keyof PredictionFeatures, 
    label: string, 
    icon: React.ReactNode, 
    step = "1"
  ) => (
    <div className="relative">
      <label htmlFor={key} className="block text-sm font-semibold text-gray-900 mb-1.5">
        {label}
      </label>
      <div className="relative rounded-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          {icon}
        </div>
        <input
          type="number"
          name={key}
          id={key}
          step={step}
          value={features[key]}
          onChange={handleChange}
          className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 transition-all bg-white"
          required
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full shadow-sm">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-900">Customer Inputs</h2>
        <p className="text-sm text-gray-500 mt-1">Enter historical metrics to predict future value.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="customer_id" className="block text-sm font-semibold text-gray-900 mb-1.5">
            Customer ID
          </label>
          <div className="relative rounded-md">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Hash className="h-4 w-4" />
             </div>
            <input
              type="text"
              id="customer_id"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 bg-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {renderInput('total_spend', FEATURE_LABELS.total_spend, <CreditCard className="h-4 w-4" />, "0.01")}
          {renderInput('avg_spend', FEATURE_LABELS.avg_spend, <Calculator className="h-4 w-4" />, "0.01")}
          {renderInput('num_transactions', FEATURE_LABELS.num_transactions, <Layers className="h-4 w-4" />)}
          {renderInput('total_units', FEATURE_LABELS.total_units, <ShoppingBag className="h-4 w-4" />)}
          {renderInput('unique_products', FEATURE_LABELS.unique_products, <Hash className="h-4 w-4" />)}
          {renderInput('recency_days', FEATURE_LABELS.recency_days, <Clock className="h-4 w-4" />)}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex w-full justify-center items-center rounded-md px-4 py-3 text-sm font-bold text-white transition-colors
              ${isLoading 
                ? 'bg-brand-600 opacity-70 cursor-wait' 
                : 'bg-brand-600 hover:bg-brand-700'
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Run Prediction
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;