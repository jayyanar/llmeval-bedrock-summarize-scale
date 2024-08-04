# llmeval-bedrock-summarize-scale

A tool for evaluating and comparing the performance of multiple large language models (LLMs) for text summarization tasks using AWS Bedrock and serverless architecture.

## Table of Contents

- [Features](#features)
- [Contributors](#Contributions)
- [Architecture](#architecture)
- [Demo](#Demo)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Contributions

 - Ayyanar Jeyakrishnan - Solution Design, Architect, and Code Review
 - Aadhityaa - Full Stack Development - AI Developer

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

![AWS_Bedrock_LLM_Playground](https://github.com/jayyanar/llmeval-bedrock-summarize-scale/assets/12956021/ebc7c30c-dbc4-4be7-b825-f89b9f4e75b9)

## Demo

[![image](https://github.com/user-attachments/assets/4c45567b-1077-4255-a0f1-bae385f1165e)](https://youtu.be/9pIXL9Ok22Y?si=Zvh9se_dr8yFwVcM)


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


# LLM Evaluation Project

This project sets up an AWS infrastructure for evaluating Language Learning Models (LLMs) using AWS Step Functions, Lambda, and API Gateway.

## Prerequisites

1. AWS CLI installed and configured
2. SAM CLI installed
3. Node.js and npm installed (for the React frontend)
4. An AWS account with necessary permissions

## Setup Instructions

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```
   cd backend
   ```

2. Update the `config.json` file with your specific ARNs and configuration details.

3. Deploy the SAM application:
   ```
   sam build
   sam deploy --guided
   ```
   Follow the prompts and provide necessary information.

4. After deployment, note down the API endpoints provided in the outputs.

### 2. Frontend Setup

1. Navigate back to the root directory and update the `.env` file with the API endpoints:
   ```
   REACT_APP_PROMPT_API=<PromptApi from SAM outputs>
   REACT_APP_RESULT_API=<ResultApi from SAM outputs>
   REACT_APP_STATUS_API=<StatusApi from SAM outputs>
   REACT_APP_EXECUTE_API=<ExecuteApi from SAM outputs>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### 3. Amplify Setup (Optional)

If you want to deploy your React application using AWS Amplify:

1. Initialize Amplify in your project:
   ```
   amplify init
   ```

2. Add hosting:
   ```
   amplify add hosting
   ```

3. Publish your app:
   ```
   amplify publish
   ```

## Required IAM Permissions

Ensure your AWS account has permissions for:

- Lambda function creation and invocation
- Step Functions creation and execution
- API Gateway creation and management
- S3 bucket creation and management
- DynamoDB table creation and access
- IAM role and policy management

## Architecture Overview

This project uses:
- AWS Lambda for serverless compute
- AWS Step Functions for orchestration
- Amazon API Gateway for RESTful APIs
- Amazon DynamoDB for data storage
- Amazon S3 for file storage

The main workflow is triggered via the `/execute` API endpoint, which starts a Step Function execution. This orchestrates the evaluation of multiple LLMs in parallel.

## Troubleshooting

- If you encounter permission issues, check the IAM roles and policies associated with your AWS account and the deployed resources.
- For API Gateway issues, check the CORS settings and ensure your frontend is sending requests to the correct endpoints.
- For Lambda function errors, check the CloudWatch logs for detailed error messages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.


 aws cloudformation delete-stack --stack-name sam-test --region us-east-1
