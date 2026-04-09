const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testOpenAI() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    console.log('Testing OpenAI (GPT-4o)...');
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    console.log('✅ OpenAI is working!', response.choices[0].message.content);
  } catch (err) {
    console.log('❌ OpenAI failed:', err.message);
  }
}

testOpenAI();
