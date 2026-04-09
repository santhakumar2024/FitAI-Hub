// test_gemini.ts
// Diagnostic script to check Gemini connectivity

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

async function testConnectivity() {
  console.log('🚀 Starting Gemini Connectivity Diagnostic...');
  console.log(`📍 Endpoint: https://generativelanguage.googleapis.com`);
  console.log(`🤖 Model: ${modelName}`);

  if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is missing in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    console.log('📡 Attempting a "ping" prompt (v1beta)...');
    const start = Date.now();
    const result = await model.generateContent('Say "Ready" if you can hear me.');
    const response = await result.response;
    const text = response.text();
    const duration = Date.now() - start;

    console.log(`✅ Success! Response: "${text.trim()}"`);
    console.log(`⏱️ Latency: ${duration}ms`);
  } catch (error: any) {
    console.error('🔴 Connectivity Failed!');
    console.error(`Status: ${error.status || 'N/A'}`);
    console.error(`Message: ${error.message}`);
    
    if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Diagnosis: Connection timed out. This is a network-level block.');
      console.log('Suggestions:');
      console.log('1. Check if you are behind a corporate firewall/proxy.');
      console.log('2. Try changing your DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).');
    }
  }
}

testConnectivity();
