// src/App.js

import React from 'react';
import './App.css';
import { withAuthenticator } from '@aws-amplify/ui-react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ROCKTEST - LLM Evaluation Tool for Bedrock Models - Summarize</h1>
        <button>Sign up</button>
      </header>
      <main>
        <div className="context-window">Context Window</div>
        <div className="model-evaluation">
          <div className="model">
            <h2>Amazon Titan</h2>
            <div className="metrics">
              <p>Accuracy: </p>
              <p>Toxicity: </p>
              <p>Robustness: </p>
              <p>Cost: </p>
            </div>
          </div>
          <div className="model">
            <h2>LLAMA 3 - 7B</h2>
            <div className="metrics">
              <p>Accuracy: </p>
              <p>Toxicity: </p>
              <p>Robustness: </p>
              <p>Cost: </p>
            </div>
          </div>
          <div className="model">
            <h2>Claude 3 - Haiku</h2>
            <div className="metrics">
              <p>Accuracy: </p>
              <p>Toxicity: </p>
              <p>Robustness: </p>
              <p>Cost: </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuthenticator(App);

