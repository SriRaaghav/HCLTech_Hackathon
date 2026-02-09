import React from 'react';
import { CustomerPredictionResponse } from '../types';
import { 
  TrendingUp, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  DollarSign, 
  UserCheck,
  Percent
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: CustomerPredictionResponse | null;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
        <TrendingUp className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Ready for Analysis</p>
        <p className="text-sm text-gray-400">Submit customer data to generate predictions.</p>
      </div>
    );
  }

  // Helpers for styling based on value
  const probabilityPercentage = Math.round(data.purchase_probability_30d * 100);
  const getProbabilityColor = (prob: number) => {
    if (prob > 0.7) return '#10b981'; // emerald-500
    if (prob > 0.4) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };
  
  const chartData = [
    { name: 'Probability', value: probabilityPercentage, fill: getProbabilityColor(data.purchase_probability_30d) }
  ];

  const getSegmentColor = (segment: string) => {
    const lower = segment.toLowerCase();
    if (lower.includes('high')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lower.includes('medium')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Stat Row - Uses auto-rows-fr to ensure equal height cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr"> 
        
        {/* Metric 1: Predicted Spend */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Predicted 30d Spend</h3>
            <div className="p-2 bg-green-50 rounded-md text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-3xl font-bold text-gray-900">
              ${data.predicted_future_spend_30d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Metric 2: Segment */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Customer Segment</h3>
            <div className="p-2 bg-blue-50 rounded-md text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <span className={`px-3 py-1.5 rounded-md text-sm font-bold border ${getSegmentColor(data.customer_segment)}`}>
              {data.customer_segment}
            </span>
          </div>
        </div>

        {/* Metric 3: Probability Visualization */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Purchase Probability</h3>
                <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                   <Percent className="h-5 w-5" />
                </div>
             </div>
             <div className="flex-1 relative min-h-[100px] flex items-center justify-center">
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="70%" 
                      outerRadius="100%" 
                      barSize={10} 
                      data={chartData} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                {/* Centered Percentage Label */}
                <div className="absolute inset-0 flex items-center justify-center pt-4 pointer-events-none">
                  <span className="text-3xl font-bold text-gray-900">{probabilityPercentage}%</span>
                </div>
             </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
           <Lightbulb className="h-5 w-5 text-brand-600" />
           <h3 className="font-bold text-gray-900">AI-Driven Insight</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-800 leading-relaxed text-base">
            {data.insight}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
           <Target className="h-5 w-5 text-emerald-600" />
           <h3 className="font-bold text-gray-900">Recommended Action</h3>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3">
             <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
             <p className="text-gray-800 font-medium text-base">
               {data.recommended_action}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;