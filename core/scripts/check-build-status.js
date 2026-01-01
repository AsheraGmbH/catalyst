#!/usr/bin/env node
/**
 * Check build status by looking at GitHub issues or triggering the workflow
 */

const https = require('https');
const { execSync } = require('child_process');

const REPO = 'AsheraGmbH/ashera-catalyst';
const BRANCH = 'testing-rebase';

async function checkGitHubIssues() {
  console.log('🔍 Checking for GitHub issues with build errors...\n');
  
  // Note: This would require a GitHub token to use the API
  // For now, we'll just provide instructions
  console.log(`📋 Check manually at: https://github.com/${REPO}/issues`);
  console.log(`   Look for issues labeled: vercel-build-error\n`);
  
  console.log('💡 To trigger the workflow to fetch logs:');
  console.log(`   1. Go to: https://github.com/${REPO}/actions`);
  console.log('   2. Select "Vercel Build Monitor & Auto-Fix"');
  console.log('   3. Click "Run workflow"');
  console.log('   4. Select branch: testing-rebase');
  console.log('   5. Click "Run workflow"\n');
  
  console.log('📊 Check Vercel dashboard:');
  console.log('   https://vercel.com/dashboard\n');
}

checkGitHubIssues();
