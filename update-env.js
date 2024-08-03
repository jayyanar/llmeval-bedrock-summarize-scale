const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runSamDeploy() {
  try {
    console.log('Running SAM build...');
    await runCommand('sam', ['build']);

    console.log('Running SAM deploy...');
    const stackName = await question('Enter stack name (default: sam-deploy): ') || 'sam-deploy';
    const region = await question('Enter AWS region (default: us-east-1): ') || 'us-east-1';

    const samProcess = spawn('sam', [
      'deploy',
      '--stack-name', stackName,
      '--region', region,
      '--capabilities', 'CAPABILITY_IAM',
      '--no-confirm-changeset',
      '--no-fail-on-empty-changeset'
    ], { stdio: 'inherit' });

    await new Promise((resolve, reject) => {
      samProcess.on('close', (code) => {
        if (code === 0) {
          console.log('SAM deployment completed successfully');
          resolve();
        } else {
          reject(new Error(`SAM deployment failed with code ${code}`));
        }
      });
    });

    console.log('Fetching stack outputs...');
    const outputs = await runCommand('aws', [
      'cloudformation',
      'describe-stacks',
      '--stack-name', stackName,
      '--query', 'Stacks[0].Outputs',
      '--output', 'json'
    ]);

    const parsedOutputs = JSON.parse(outputs);
    let envContent = '';

    parsedOutputs.forEach(output => {
      if (output.OutputKey.endsWith('Api')) {
        envContent += `REACT_APP_${output.OutputKey.toUpperCase()}=${output.OutputValue}\n`;
      }
    });

    fs.writeFileSync('.env', envContent);
    console.log('Updated .env file with API endpoints:');
    console.log(envContent);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString());
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

runSamDeploy();