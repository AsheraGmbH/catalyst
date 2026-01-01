#!/usr/bin/env node
/**
 * Fetch Vercel build logs and optionally create a commit with fixes
 * 
 * Usage:
 *   node fetch-vercel-logs.js [deployment-id]
 *   node fetch-vercel-logs.js --latest
 *   node fetch-vercel-logs.js --auto-fix
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOYMENT_ID = process.argv[2];
const AUTO_FIX = process.argv.includes('--auto-fix');
const LATEST = process.argv.includes('--latest') || !DEPLOYMENT_ID;

async function main() {
  try {
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch {
      console.error('❌ Vercel CLI not found. Install it with: npm install -g vercel');
      process.exit(1);
    }

    // Check if we're in a git repo
    let gitRepo = false;
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      gitRepo = true;
    } catch {
      console.warn('⚠️  Not in a git repository. Logs will be saved but not committed.');
    }

    // Get deployment ID
    let deploymentId = DEPLOYMENT_ID;
    if (LATEST) {
      console.log('📡 Fetching latest deployment...');
      const output = execSync('vercel ls --limit=1 --format=json', { encoding: 'utf-8' });
      const deployments = JSON.parse(output);
      if (deployments.length === 0) {
        console.error('❌ No deployments found');
        process.exit(1);
      }
      deploymentId = deployments[0].uid;
      console.log(`✅ Found deployment: ${deploymentId}`);
    }

    // Fetch logs
    console.log(`📥 Fetching logs for deployment: ${deploymentId}`);
    const logsDir = path.join(process.cwd(), '.vercel-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `build-${deploymentId}.txt`);
    const errorFile = path.join(logsDir, `errors-${deploymentId}.txt`);
    const infoFile = path.join(logsDir, `deployment-${deploymentId}.json`);

    try {
      execSync(`vercel logs ${deploymentId} > "${logFile}" 2>&1`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Could not fetch all logs, but continuing...');
    }

    // Get deployment info
    try {
      execSync(`vercel inspect ${deploymentId} --format=json > "${infoFile}"`, { stdio: 'ignore' });
    } catch {
      console.warn('⚠️  Could not fetch deployment info');
    }

    // Extract errors
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf-8');
      const errorLines = logs
        .split('\n')
        .filter(line => 
          /error|failed|fatal|cannot|missing|not found/i.test(line)
        )
        .slice(0, 100); // Limit to first 100 error lines

      if (errorLines.length > 0) {
        fs.writeFileSync(errorFile, errorLines.join('\n'));
        console.log(`\n❌ Found ${errorLines.length} potential error lines`);
        console.log('\n📋 Error Summary:');
        console.log(errorLines.slice(0, 10).join('\n'));
        if (errorLines.length > 10) {
          console.log(`\n... and ${errorLines.length - 10} more (see ${errorFile})`);
        }
      } else {
        console.log('✅ No obvious errors found in logs');
      }
    }

    console.log(`\n📁 Logs saved to: ${logFile}`);
    if (fs.existsSync(errorFile)) {
      console.log(`📁 Errors saved to: ${errorFile}`);
    }

    // Auto-fix if requested
    if (AUTO_FIX && fs.existsSync(errorFile)) {
      console.log('\n🔧 Attempting to auto-fix common errors...');
      const errors = fs.readFileSync(errorFile, 'utf-8');
      
      // This is a placeholder - you can extend this with actual fix logic
      console.log('💡 Review the errors and apply fixes manually, or extend this script with auto-fix logic');
      
      if (gitRepo) {
        console.log('\n💡 To commit these logs, run:');
        console.log(`   git add ${logFile} ${errorFile} ${infoFile}`);
        console.log(`   git commit -m "chore: add Vercel build logs for ${deploymentId}"`);
      }
    }

    // Open logs in editor if requested
    if (process.argv.includes('--open')) {
      const { exec } = require('child_process');
      exec(`code "${logFile}"`, (error) => {
        if (error) {
          console.log(`\n💡 Open the log file manually: ${logFile}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
