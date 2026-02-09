import React, { useState } from 'react';
import { Activity, ExternalLink, AlertCircle } from 'lucide-react';
import InputForm from './components/InputForm';
import Dashboard from './components/Dashboard';
import { CustomerPredictionResponse, PredictionFeatures } from './types';
import { predictCustomerValue } from './services/apiService';

function App() {
  const [result, setResult] = useState<CustomerPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrediction = async (id: string, features: PredictionFeatures) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await predictCustomerValue(id, features);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred connecting to the prediction engine.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation / Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 p-2 rounded-md text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">RetailAI Analytics</h1>
                <p className="text-xs text-gray-500 font-medium">Customer Value Prediction</p>
              </div>
            </div>
            <div className="flex items-center">
              <a 
                href="https://hcl-hack.onrender.com/docs" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors"
              >
                API Docs
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4">
             <InputForm isLoading={isLoading} onSubmit={handlePrediction} />
             
             {/* Tech Stack Info Footer */}
             <div className="mt-6 text-center text-xs text-gray-400">
                <p>Powered by Python (FastAPI) & React</p>
             </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            <Dashboard data={result} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;