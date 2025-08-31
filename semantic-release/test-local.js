#!/usr/bin/env node

// Mock GitHub Actions environment for local testing
process.env.INPUT_DRY_RUN = 'true';
process.env.INPUT_WORKING_DIRECTORY = '.';
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'dummy-token-for-dry-run';
process.env.GITHUB_REPOSITORY = 'joelcox22/actions';
process.env.GITHUB_REF = 'refs/heads/main';
process.env.GITHUB_SHA = '1234567890abcdef';
process.env.GITHUB_ACTOR = 'test-user';
process.env.GITHUB_WORKFLOW = 'test-workflow';
process.env.GITHUB_RUN_ID = '12345';
process.env.GITHUB_RUN_NUMBER = '1';
process.env.GITHUB_JOB = 'test-job';
process.env.GITHUB_ACTION = 'test-action';
process.env.GITHUB_EVENT_NAME = 'push';
process.env.GITHUB_EVENT_PATH = '/tmp/github_event.json';
process.env.GITHUB_WORKSPACE = process.cwd();
process.env.GITHUB_API_URL = 'https://api.github.com';
process.env.GITHUB_SERVER_URL = 'https://github.com';
process.env.GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Create a mock event file
const fs = require('fs');
const mockEvent = {
  repository: {
    name: 'actions',
    full_name: 'joelcox22/actions',
    owner: {
      login: 'joelcox22'
    }
  },
  ref: 'refs/heads/main',
  sha: '1234567890abcdef'
};

fs.writeFileSync('/tmp/github_event.json', JSON.stringify(mockEvent, null, 2));

console.log('🧪 Testing bundled action locally with dry-run mode...');
console.log('📦 All dependencies should be bundled - no npm install needed');
console.log('Environment setup:');
console.log(`- Repository: ${process.env.GITHUB_REPOSITORY}`);
console.log(`- Branch: ${process.env.GITHUB_REF}`);
console.log(`- Dry run: ${process.env.INPUT_DRY_RUN}`);
console.log(`- Working directory: ${process.env.INPUT_WORKING_DIRECTORY}`);
console.log('');

// Run the bundled action
try {
  require('./dist/index.cjs');
} catch (error) {
  console.error('❌ Error running bundled action:', error);
  process.exit(1);
}
