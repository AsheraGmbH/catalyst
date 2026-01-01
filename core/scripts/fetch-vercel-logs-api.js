#!/usr/bin/env node
/**
 * Fetch Vercel build logs directly using Vercel REST API
 * No CLI installation required - uses API with token
 * 
 * Usage:
 *   node fetch-vercel-logs-api.js [deployment-id]
 *   node fetch-vercel-logs-api.js --latest
 *   node fetch-vercel-logs-api.js --watch (poll every 10s until build completes)
 * 
 * Environment variables:
 *   VERCEL_TOKEN - Your Vercel API token (required)
 *   VERCEL_TEAM_ID - Optional team ID
 *   VERCEL_PROJECT_ID - Optional project ID (for filtering)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const DEPLOYMENT_ID = process.argv.find(arg => arg && !arg.startsWith('--'));
const LATEST = process.argv.includes('--latest') || !DEPLOYMENT_ID;
const WATCH = process.argv.includes('--watch');

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  console.error('   Get your token from: https://vercel.com/account/tokens');
  process.exit(1);
}

// Vercel API base URL
const API_BASE = 'https://api.vercel.com';

/**
 * Make HTTP request to Vercel API
 */
function vercelRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    if (VERCEL_TEAM_ID) {
      url.searchParams.set('teamId', VERCEL_TEAM_ID);
    }

    const headers = {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'User-Agent': 'vercel-build-log-fetcher',
      ...options.headers,
    };

    const req = https.request(url, { method: options.method || 'GET', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * Get latest deployments
 */
async function getLatestDeployments(limit = 10) {
  try {
    const deployments = await vercelRequest(`/v6/deployments?limit=${limit}&projectId=${VERCEL_PROJECT_ID || ''}`);
    return deployments.deployments || [];
  } catch (error) {
    console.error('❌ Failed to fetch deployments:', error.message);
    throw error;
  }
}

/**
 * Get deployment by ID
 */
async function getDeployment(deploymentId) {
  try {
    const deployment = await vercelRequest(`/v13/deployments/${deploymentId}`);
    return deployment;
  } catch (error) {
    console.error(`❌ Failed to fetch deployment ${deploymentId}:`, error.message);
    throw error;
  }
}

/**
 * Get build logs for a deployment
 */
async function getBuildLogs(deploymentId) {
  try {
    // Vercel API endpoint for logs
    const logs = await vercelRequest(`/v2/deployments/${deploymentId}/events`, {
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    
    // If that doesn't work, try the build logs endpoint
    try {
      const buildLogs = await vercelRequest(`/v1/deployments/${deploymentId}/build-logs`);
      return buildLogs;
    } catch {
      // Fallback: use deployment events
      const events = await vercelRequest(`/v2/deployments/${deploymentId}/events`);
      return events;
    }
  } catch (error) {
    console.warn('⚠️  Could not fetch logs via API, trying alternative method...');
    // Try to get logs from deployment URL
    try {
      const deployment = await getDeployment(deploymentId);
      if (deployment.url) {
        console.log(`💡 View logs at: https://vercel.com/${deployment.url.split('//')[1]?.split('/')[0] || 'dashboard'}/deployments/${deploymentId}`);
      }
    } catch {}
    throw error;
  }
}

/**
 * Stream logs from deployment events
 */
async function streamDeploymentLogs(deploymentId) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/v2/deployments/${deploymentId}/events`, API_BASE);
    if (VERCEL_TEAM_ID) {
      url.searchParams.set('teamId', VERCEL_TEAM_ID);
    }

    const headers = {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Accept': 'text/event-stream',
    };

    const req = https.request(url, { headers }, (res) => {
      let buffer = '';
      
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              process.stdout.write(data.payload?.text || data.payload || '');
            } catch {
              // Not JSON, output as-is
              if (line.trim()) {
                process.stdout.write(line + '\n');
              }
            }
          }
        }
      });

      res.on('end', () => resolve(buffer));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  try {
    let deploymentId = DEPLOYMENT_ID;
    let deployment;

    // Get deployment ID
    if (LATEST) {
      console.log('📡 Fetching latest deployments...');
      const deployments = await getLatestDeployments(5);
      
      if (deployments.length === 0) {
        console.error('❌ No deployments found');
        process.exit(1);
      }

      // Filter by project if specified
      let targetDeployment = deployments[0];
      if (VERCEL_PROJECT_ID) {
        targetDeployment = deployments.find(d => d.projectId === VERCEL_PROJECT_ID) || deployments[0];
      }

      deploymentId = targetDeployment.uid || targetDeployment.id;
      deployment = targetDeployment;
      console.log(`✅ Found deployment: ${deploymentId}`);
      console.log(`   State: ${deployment.state || 'unknown'}`);
      console.log(`   URL: ${deployment.url || 'N/A'}`);
    } else {
      console.log(`📡 Fetching deployment: ${deploymentId}`);
      deployment = await getDeployment(deploymentId);
      console.log(`   State: ${deployment.state || 'unknown'}`);
      console.log(`   URL: ${deployment.url || 'N/A'}`);
    }

    // Check if build is still in progress
    const isBuilding = ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(deployment.state);
    
    if (isBuilding && !WATCH) {
      console.log('\n⏳ Build is still in progress. Use --watch to monitor live.');
      console.log(`   Or wait ~90 seconds and run again.\n`);
    }

    // Watch mode: poll until build completes
    if (WATCH && isBuilding) {
      console.log('\n👀 Watching build (polling every 10 seconds)...\n');
      let currentState = deployment.state;
      
      while (['BUILDING', 'INITIALIZING', 'QUEUED'].includes(currentState)) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          deployment = await getDeployment(deploymentId);
          currentState = deployment.state;
          process.stdout.write(`\r⏳ Build status: ${currentState}...`);
        } catch (error) {
          console.error('\n❌ Error checking status:', error.message);
          break;
        }
      }
      console.log(`\n✅ Build completed with state: ${currentState}\n`);
    }

    // Fetch logs
    console.log(`📥 Fetching logs for deployment: ${deploymentId}`);
    
    const logsDir = path.join(process.cwd(), '.vercel-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `build-${deploymentId}.txt`);
    
    try {
      // Try to stream logs
      console.log('📡 Streaming deployment logs...');
      const logs = await streamDeploymentLogs(deploymentId);
      fs.writeFileSync(logFile, logs);
      console.log(`✅ Logs saved to: ${logFile}`);
    } catch (error) {
      console.warn('⚠️  Could not stream logs, trying alternative method...');
      
      // Alternative: get deployment info and provide dashboard link
      const deploymentInfo = {
        id: deploymentId,
        state: deployment.state,
        url: deployment.url,
        createdAt: deployment.createdAt,
        readyAt: deployment.readyAt,
        error: deployment.error,
      };
      
      const infoFile = path.join(logsDir, `deployment-${deploymentId}.json`);
      fs.writeFileSync(infoFile, JSON.stringify(deploymentInfo, null, 2));
      
      console.log(`\n📋 Deployment info saved to: ${infoFile}`);
      console.log(`\n💡 To view logs, visit:`);
      console.log(`   https://vercel.com/dashboard`);
      console.log(`   Navigate to your project → Deployments → ${deploymentId}`);
      
      if (deployment.error) {
        console.log(`\n❌ Build Error:`);
        console.log(JSON.stringify(deployment.error, null, 2));
      }
    }

    // Extract errors from logs if available
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf-8');
      const errorLines = logs
        .split('\n')
        .filter(line => 
          /error|failed|fatal|cannot|missing|not found|TypeError|ReferenceError/i.test(line)
        )
        .slice(0, 100);

      if (errorLines.length > 0) {
        const errorFile = path.join(logsDir, `errors-${deploymentId}.txt`);
        fs.writeFileSync(errorFile, errorLines.join('\n'));
        console.log(`\n❌ Found ${errorLines.length} potential error lines`);
        console.log('\n📋 Error Summary (first 10):');
        console.log(errorLines.slice(0, 10).join('\n'));
        if (errorLines.length > 10) {
          console.log(`\n... and ${errorLines.length - 10} more (see ${errorFile})`);
        }
      } else {
        console.log('\n✅ No obvious errors found in logs');
      }
    }

    // Show final status
    if (deployment.state === 'ERROR' || deployment.state === 'CANCELED') {
      console.log(`\n❌ Build failed with state: ${deployment.state}`);
      if (deployment.error) {
        console.log(`\nError details:`, JSON.stringify(deployment.error, null, 2));
      }
      process.exit(1);
    } else if (deployment.state === 'READY') {
      console.log(`\n✅ Build succeeded!`);
      console.log(`   URL: ${deployment.url}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
