// src/components/Dashboard.js
import React, { useState } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

const StatusIcon = ({ status }) => {
  switch (status) {
    case "running":
      return (
        <svg
          className="animate-spin h-5 w-5 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
    case "failed":
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    case "stopped":
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case "completed":
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    default:
      return null;
  }
};

const Dashboard = ({ modelGroups = {} }) => {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState(["", "", ""]);
  const [evaluationModel, setEvaluationModel] = useState("");
  const [latestJob, setLatestJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleModelSelect = (index, model) => {
    const newSelectedModels = [...selectedModels];
    newSelectedModels[index] = model;
    setSelectedModels(newSelectedModels);
  };

  const handleExecute = async () => {
    if (
      prompt &&
      selectedModels.filter(Boolean).length === 3 &&
      evaluationModel
    ) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_EXECUTEAPI}`,
          {
            Context: prompt,
            Model1: selectedModels[0],
            Model2: selectedModels[1],
            Model3: selectedModels[2],
            eval_model: evaluationModel,
            RunID: `summary_${Math.random().toString(36).substr(2, 8)}`,
          },
          {
            headers: {
              'x-api-key': process.env.REACT_APP_API_KEY,
            },
          }
        );
        console.log("API response:", response.data);
        setLatestJob(response.data);
        setShowSuccessPopup(true);
      } catch (error) {
        console.error("Error executing models:", error);
        alert("An error occurred while executing the models. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert(
        "Please enter a prompt, select 3 models, and an evaluation model before executing."
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Enter your Prompt to Summarize
        </h3>
        <textarea
          className="w-full p-4 border rounded mb-4 text-sm"
          placeholder="Explain something about large language models in short with less than a para"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <div className="flex space-x-4 mb-4">
          {[0, 1, 2].map((index) => (
            <select
              key={index}
              className="flex-1 bg-white border rounded p-2 text-gray-700"
              value={selectedModels[index]}
              onChange={(e) => handleModelSelect(index, e.target.value)}
            >
              <option value="">Select Model</option>
              {Object.entries(modelGroups).map(([group, models]) => (
                <optgroup key={group} label={group}>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          ))}
        </div>
        <div className="mb-4">
          <select
            className="w-full bg-white border rounded p-2 text-gray-700"
            value={evaluationModel}
            onChange={(e) => setEvaluationModel(e.target.value)}
          >
            <option value="">Select Evaluation Model</option>
            {Object.entries(modelGroups).flatMap(([group, models]) =>
              models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">1</span>
          <button
            className={`bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleExecute}
            disabled={isLoading}
          >
            {isLoading ? "Executing..." : "Execute"}
          </button>
        </div>
      </div>
      {latestJob && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Latest Job: {latestJob.RunID}
          </h3>
          <div className="mb-4">
            <h4 className="font-medium">Input Prompt:</h4>
            <p className="text-gray-700">{latestJob.Context}</p>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon status={latestJob.Status} />
            <span className="capitalize">{latestJob.Status}</span>
          </div>
        </div>
      )}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">API Call Successful</h3>
            <p>Your RunID is: {latestJob?.RunID}</p>
            <button
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              onClick={() => setShowSuccessPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
