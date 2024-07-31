import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ResultView = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { runId } = useParams();

  useEffect(() => {
    fetchResult();
  }, [runId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/result`,
        { RunID: runId },
        { 
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Error fetching result:', error);
      setError(error.response?.data?.error || 'Failed to fetch results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const normalizeModelData = (modelData) => {
    return {
      modelId: modelData.Model_id,
      summary: modelData.summary,
      robustness: modelData.robustness,
      accuracy: modelData.accuracy,
      toxicity: modelData.toxicity
    };
  };

  if (loading) return <div className="text-center py-4">Loading results...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;
  if (!result) return <div className="text-center py-4">No results found for this project.</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Result for RunID: {result.RunID}</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Context:</h3>
          <p className="text-gray-600">{result.Content}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['model1', 'model2', 'model3'].map((modelKey) => {
            const normalizedData = normalizeModelData(result[modelKey]);
            return (
              <div key={modelKey} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">{modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}</h3>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-700">Model ID:</span> <span className="text-gray-600">{normalizedData.modelId}</span></p>
                  <p><span className="font-medium text-gray-700">Accuracy:</span> <span className="text-gray-600">{normalizedData.accuracy}</span></p>
                  <p><span className="font-medium text-gray-700">Toxicity:</span> <span className="text-gray-600">{normalizedData.toxicity}</span></p>
                  <p><span className="font-medium text-gray-700">Robustness:</span> <span className="text-gray-600">{normalizedData.robustness}</span></p>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Summary:</p>
                    <p className="text-gray-600 text-sm">{normalizedData.summary}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultView;