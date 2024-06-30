import React from 'react';
import ReactDOM from 'react-dom';
import Amplify from 'aws-amplify';
import awsExports from './aws-exports';
import App from './App';
import { AmplifyProvider } from '@aws-amplify/ui-react';

Amplify.configure(awsExports);

ReactDOM.render(
  <AmplifyProvider>
    <App />
  </AmplifyProvider>,
  document.getElementById('root')
);

