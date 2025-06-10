const axios = require('axios');

async function testOpenRouterDirectly() {
  console.log('Testing OpenRouter API directly...');
  
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Привет! Это тест.' }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'no',
        'X-Title': 'test'
      }
    });
    
    console.log('✅ OpenRouter API works!');
    console.log('Response:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenRouter API error:', error.response?.data || error.message);
  }
}

testOpenRouterDirectly();
