import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

const StatusIcon = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'running':
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
    case 'failed':
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    case 'stopped':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'completed':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    default:
      return null;
  }
};

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_STATUSAPI}`, { withCredentials: false });
      setProjects(JSON.parse(response.data.body));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Projects</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Run ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.RunID}>
                <td className="px-6 py-4 whitespace-nowrap">{project.RunID}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <StatusIcon status={project.Status} />
                    <span className="ml-2 capitalize">{project.Status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {project.Status?.toLowerCase() === 'completed' ? (
                    <Link
                      to={`/result/${project.RunID}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Results
                    </Link>
                  ) : (
                    <span className="text-gray-400 cursor-not-allowed">
                      View Results
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;