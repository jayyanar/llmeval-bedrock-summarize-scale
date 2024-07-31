import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/prompt`);
      setPrompts(JSON.parse(response.data.body));
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Prompts</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <tr key={prompt.RunID}>
                <td className="px-6 py-4 whitespace-nowrap">{prompt.RunID}</td>
                <td className="px-6 py-4">{prompt.Context}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prompts;