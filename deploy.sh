#!/bin/bash

set -e

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Create a temporary Node.js script
cat << 'EOF' > temp_deploy.js
const { spawn } = require('child_process');
const fs = require('fs');

async function runSamDeploy() {
  try {
    console.log('Running SAM build...');
    await runCommand('sam', ['build'], { cwd: 'sam-app' });

    console.log('Running SAM deploy...');
    await runCommand('sam', [
      'deploy',
      '--stack-name', 'sam-deploy',
      '--capabilities', 'CAPABILITY_IAM',
      '--region', 'us-east-1',
      '--no-confirm-changeset',
      '--no-fail-on-empty-changeset'
    ], { cwd: 'sam-app' });

    console.log('Fetching stack outputs...');
    const outputs = await runCommand('aws', [
      'cloudformation',
      'describe-stacks',
      '--stack-name', 'sam-deploy',
      '--query', 'Stacks[0].Outputs',
      '--output', 'json'
    ]);

    console.log('Raw outputs:', outputs);

    let parsedOutputs;
    try {
      parsedOutputs = JSON.parse(outputs);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.error('Raw output:', outputs);
      throw new Error('Failed to parse stack outputs');
    }

    let envContent = '';

    parsedOutputs.forEach(output => {
      if (output.OutputKey.endsWith('Api')) {
        envContent += `REACT_APP_${output.OutputKey.toUpperCase()}=${output.OutputValue}\n`;
      }
    });

    // Read existing .env file
    let existingEnv = '';
    if (fs.existsSync('.env')) {
      existingEnv = fs.readFileSync('.env', 'utf8');
    }

    // Update or append new values
    const updatedEnv = updateEnvContent(existingEnv, envContent);

    fs.writeFileSync('.env', updatedEnv);
    console.log('Updated .env file with API endpoints:');
    console.log(updatedEnv);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { ...options, stdio: ['inherit', 'pipe', 'inherit'] });
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

function updateEnvContent(existing, newContent) {
  const existingLines = existing.split('\n');
  const newLines = newContent.split('\n');

  newLines.forEach(newLine => {
    const [key] = newLine.split('=');
    const index = existingLines.findIndex(line => line.startsWith(key));
    if (index !== -1) {
      existingLines[index] = newLine;
    } else {
      existingLines.push(newLine);
    }
  });

  return existingLines.join('\n');
}

runSamDeploy();
EOF

# Run the Node.js script
echo "Running SAM deployment script..."
node temp_deploy.js

# Check if the script ran successfully
if [ $? -eq 0 ]
then
    echo "SAM deployment completed successfully."
    echo "The .env file has been updated with the new API endpoints."
else
    echo "SAM deployment script encountered an error. Please check the output above for details."
    exit 1
fi

# Clean up temporary script
rm temp_deploy.js

# Rebuild React app with updated .env
npm run build

echo "Deployment process completed."