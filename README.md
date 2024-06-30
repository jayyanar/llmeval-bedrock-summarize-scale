# llmeval-bedrock-summarize-scale

A tool for evaluating and comparing the performance of multiple large language models (LLMs) for text summarization tasks using AWS Bedrock and serverless architecture.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Automatic Deployment and Scaling**: 
  - Changes pushed to the GitHub repository automatically trigger the evaluation workflow, eliminating manual intervention.
  - AWS Step Functions orchestrate the parallel evaluation of multiple LLMs, ensuring efficient resource utilization.
- **Scalability and Cost-Effectiveness**: 
  - By leveraging serverless services like AWS Step Functions, API Gateway, and Bedrock LLM, the architecture can scale up or down based on demand, minimizing overhead costs when not in use.
- **Centralized Result Storage**: 
  - The evaluation results for each LLM are stored in a centralized database or data store, allowing for easy analysis and comparison.
- **Modular Architecture**: 
  - The modular design with loosely coupled components enables easy integration of new LLMs or swapping existing ones, promoting flexibility and extensibility.

## Architecture

1. Developers push code changes to a GitHub repository.
2. The Amplify WebHosting service detects the changes and triggers a GET request to the Amazon API Gateway.
3. The API Gateway invokes an AWS Step Function, which acts as an orchestrator for the evaluation process.
4. The Step Function parallelizes the evaluation by triggering multiple instances of the Call Bedrock LLM for Model Evaluation step, one for each model (Model 1, Model 2, Model 3) to be evaluated.
5. The results of each model's evaluation are stored in a database or data store.
6. The Amazon API Gateway acts as a proxy, receiving requests from the Amplify WebHosting service and routing them to the appropriate Step Function.

## Getting Started

### Prerequisites

- AWS account
- GitHub account
- AWS CLI installed and configured
- Basic knowledge of AWS services (API Gateway, Step Functions, Lambda, DynamoDB/S3)

### Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/yourusername/llmeval-bedrock-summarize-scale.git

2. cd llmeval-bedrock-summarize-scale