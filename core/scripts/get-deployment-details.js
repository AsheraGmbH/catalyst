#!/usr/bin/env node
/**
 * Get detailed deployment information including build errors
 */

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const DEPLOYMENT_ID = process.argv[2] || 'dpl_C2E23KiMcScikb4tHHQqo6f3WQjE';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

function vercelRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.vercel.com${endpoint}`);
    
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'User-Agent': 'vercel-deployment-checker',
      },
    }, (res) => {
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
    req.end();
  });
}

async function main() {
  try {
    console.log(`📡 Fetching deployment details: ${DEPLOYMENT_ID}\n`);
    
    const deployment = await vercelRequest(`/v13/deployments/${DEPLOYMENT_ID}`);
    
    console.log('📋 Deployment Information:');
    console.log(`   ID: ${deployment.uid || deployment.id}`);
    console.log(`   State: ${deployment.state}`);
    console.log(`   URL: ${deployment.url || 'N/A'}`);
    console.log(`   Created: ${new Date(deployment.createdAt).toLocaleString()}`);
    
    if (deployment.readyAt) {
      console.log(`   Ready: ${new Date(deployment.readyAt).toLocaleString()}`);
    }
    
    if (deployment.error) {
      console.log(`\n❌ Build Error:`);
      console.log(JSON.stringify(deployment.error, null, 2));
    }
    
    if (deployment.buildErrorAt) {
      console.log(`\n❌ Build failed at: ${new Date(deployment.buildErrorAt).toLocaleString()}`);
    }
    
    // Try to get build logs
    try {
      console.log('\n📥 Attempting to fetch build logs...');
      const events = await vercelRequest(`/v2/deployments/${DEPLOYMENT_ID}/events`);
      console.log('Events:', JSON.stringify(events, null, 2));
    } catch (error) {
      console.log(`⚠️  Could not fetch events: ${error.message}`);
    }
    
    // Get build logs URL
    console.log(`\n💡 View logs at:`);
    console.log(`   https://vercel.com/${deployment.team?.slug || 'dashboard'}/ashera-catalyst/deployments/${DEPLOYMENT_ID}`);
    
    // Save full deployment info
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), '.vercel-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const infoFile = path.join(logsDir, `deployment-${DEPLOYMENT_ID}-full.json`);
    fs.writeFileSync(infoFile, JSON.stringify(deployment, null, 2));
    console.log(`\n📁 Full deployment info saved to: ${infoFile}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
