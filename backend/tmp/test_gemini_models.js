const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Note: The SDK might not have a direct listModels yet, 
    // but we can try common ones.
    console.log('Testing specific models...');
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
    
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent('test');
        console.log(`✅ ${m} is working!`);
      } catch (err) {
        console.log(`❌ ${m} failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
