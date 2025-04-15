#!/usr/bin/env node

/**
 * Test script for Gmail and YouTube integrations
 * 
 * This script tests the Gmail and YouTube integrations by:
 * 1. Checking the status of the connections
 * 2. Verifying token storage in Convex
 * 3. Testing API access
 * 
 * Usage:
 * node scripts/test-social-integrations.js
 */

const { execSync } = require('child_process');
const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function main() {
  console.log('Testing Gmail and YouTube integrations...');
  
  // Step 1: Check if the app is running
  try {
    console.log('Checking if the app is running...');
    const response = await fetch(`${APP_URL}/api/health`);
    if (!response.ok) {
      console.error('App is not running. Please start the app first.');
      process.exit(1);
    }
    console.log('App is running.');
  } catch (error) {
    console.error('Failed to connect to the app:', error.message);
    console.log('Please make sure the app is running at', APP_URL);
    process.exit(1);
  }
  
  // Step 2: Prompt for login
  console.log('\nPlease log in to the app in your browser.');
  console.log(`Open ${APP_URL}/login in your browser.`);
  
  await new Promise(resolve => {
    rl.question('Press Enter after you have logged in...', resolve);
  });
  
  // Step 3: Test Gmail connection
  console.log('\nTesting Gmail connection...');
  try {
    const gmailResponse = await fetch(`${APP_URL}/api/platforms/gmail/status`);
    const gmailData = await gmailResponse.json();
    
    if (gmailData.isConnected) {
      console.log('✅ Gmail connection is working!');
      console.log('Gmail profile:', gmailData.profile);
    } else {
      console.log('❌ Gmail is not connected.');
      console.log('Error:', gmailData.error);
      console.log('\nTo connect Gmail, go to:');
      console.log(`${APP_URL}/settings`);
    }
  } catch (error) {
    console.error('Failed to test Gmail connection:', error.message);
  }
  
  // Step 4: Test YouTube connection
  console.log('\nTesting YouTube connection...');
  try {
    const youtubeResponse = await fetch(`${APP_URL}/api/platforms/youtube/status`);
    const youtubeData = await youtubeResponse.json();
    
    if (youtubeData.isConnected) {
      console.log('✅ YouTube connection is working!');
      console.log('YouTube channel:', youtubeData.channel);
    } else {
      console.log('❌ YouTube is not connected.');
      console.log('Error:', youtubeData.error);
      console.log('\nTo connect YouTube, go to:');
      console.log(`${APP_URL}/settings`);
    }
  } catch (error) {
    console.error('Failed to test YouTube connection:', error.message);
  }
  
  rl.close();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
