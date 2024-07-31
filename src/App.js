import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import axios from "axios";
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import EvaluationJobs from './components/EvaluationJobs';
import Prompts from './components/Prompts';
import ResultView from './components/ResultView';
// import Login from './components/Login';

const modelGroups = {
  Anthropic: [
    "anthropic.claude-v2:1",
    "anthropic.claude-v2",
    "anthropic.claude-3-haiku-20240307-v1:0",
    "anthropic.claude-instant-v1",
    "anthropic.claude-3-sonnet-20240229-v1:0",
  ],
  Cohere: [
    "cohere.command-text-v14",
    "cohere.command-light-text-v14",
  ],
  AI21: ["ai21.j2-ultra-v1", "ai21.j2-mid-v1"],
  Meta: ["meta.llama3-70b-instruct-v1:0", "meta.llama3-8b-instruct-v1:0"],
  Mistral: [
    "mistral.mistral-7b-instruct-v0:2",
    "mistral.mistral-large-2402-v1:0",
    "mistral.mistral-small-2402-v1:0",
    "mistral.mixtral-8x7b-instruct-v0:1",
  ],
  Amazon: [
    "amazon.titan-text-express-v1",
    "amazon.titan-text-lite-v1",
    "amazon.titan-text-premier-v1:0",
  ],
};

function App() {
  const [projects, setProjects] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/status`
      );
      setProjects(JSON.parse(response.data.body));
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // const handleLogin = () => {
  //   setIsAuthenticated(true);
  // };

  // if (!isAuthenticated) {
  //   return <Login onLogin={handleLogin} />;
  // }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-blue-700 text-white p-6">
          <h2 className="text-xl font-bold mb-6">
            LLM Evaluation
            <br />
            Console
            <br />- Summarization -
          </h2>
          <nav className="space-y-2">
            <Link
              to="/"
              className="flex items-center space-x-2 py-2 px-4 hover:bg-blue-600 rounded"
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/projects"
              className="flex items-center space-x-2 py-2 px-4 hover:bg-blue-600 rounded"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
              <span>Projects</span>
              <span className="ml-auto bg-blue-600 text-xs font-semibold px-2 py-1 rounded-full">
                {projects.length}
              </span>
            </Link>
            <Link
              to="/evaluation-jobs"
              className="flex items-center space-x-2 py-2 px-4 hover:bg-blue-600 rounded"
            >
              <ClipboardDocumentListIcon className="w-5 h-5" />
              <span>Evaluation Jobs</span>
            </Link>
            <Link
              to="/prompts"
              className="flex items-center space-x-2 py-2 px-4 hover:bg-blue-600 rounded"
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>Prompts</span>
            </Link>
          </nav>
          <div className="mt-auto space-y-2">
            <button className="flex items-center space-x-2 w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
            <button className="flex items-center space-x-2 w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded">
              <QuestionMarkCircleIcon className="w-5 h-5" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-10 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Projects</h2>
            <div className="flex items-center space-x-2">
              <span>Thesa 1</span>
              <ChevronDownIcon className="w-5 h-5" />
              <img
                src=""
                alt="User"
                className="w-10 h-10 rounded-full"
              />
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Dashboard modelGroups={modelGroups} />} />
            <Route
              path="/projects"
              element={<Projects projects={projects} />}
            />
            <Route path="/evaluation-jobs" element={<EvaluationJobs />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/results/:runId" element={<ResultView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;