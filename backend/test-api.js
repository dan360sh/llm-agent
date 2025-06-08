const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🚀 Testing LLM Agent API...\n');

  try {
    // 1. Тест health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // 2. Добавление OpenRouter модели
    console.log('\n2. Adding OpenRouter GPT-4O model...');
    const openrouterModel = {
      name: "OpenRouter GPT-4O",
      provider: "openai",
      config: {
        apiKey: "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",
        baseURL: "https://openrouter.ai/api/v1",
        model: "openai/gpt-4o",
        maxTokens: 3000,
        temperature: 0.7,
        headers: {
          "HTTP-Referer": "no",
          "X-Title": "test"
        }
      },
      supportsImages: true,
      enabled: true
    };

    const addModelResponse = await axios.post(`${API_BASE}/llm`, openrouterModel);
    console.log('✅ Model added:', addModelResponse.data);

    // 3. Добавление Ollama модели
    console.log('\n3. Adding Ollama Llava model...');
    const ollamaModel = {
      name: "Ollama Llava",
      provider: "ollama",
      config: {
        baseURL: "http://localhost:11434",
        model: "llava:7b",
        temperature: 0.7,
        maxTokens: 3000
      },
      supportsImages: true,
      enabled: true
    };

    const addOllamaResponse = await axios.post(`${API_BASE}/llm`, ollamaModel);
    console.log('✅ Ollama model added:', addOllamaResponse.data);

    // 4. Получение списка моделей
    console.log('\n4. Getting all models...');
    const modelsResponse = await axios.get(`${API_BASE}/llm`);
    console.log('✅ Models list:', modelsResponse.data);

    // 5. Тестирование подключения
    if (modelsResponse.data.length > 0) {
      const modelId = modelsResponse.data[0].id;
      console.log(`\n5. Testing connection for model ${modelId}...`);
      
      try {
        const testResponse = await axios.post(`${API_BASE}/llm/${modelId}/test`);
        console.log('✅ Connection test:', testResponse.data);
      } catch (error) {
        console.log('❌ Connection test failed:', error.response?.data || error.message);
      }
    }

    // 6. Получение агентов
    console.log('\n6. Getting agents...');
    const agentsResponse = await axios.get(`${API_BASE}/agents`);
    console.log('✅ Agents:', agentsResponse.data);

    // 7. Обновление агента с LLM моделью
    if (agentsResponse.data.length > 0 && modelsResponse.data.length > 0) {
      const agentId = agentsResponse.data[0].id;
      const modelId = modelsResponse.data[0].id;
      
      console.log(`\n7. Updating agent ${agentId} with model ${modelId}...`);
      const updateAgentResponse = await axios.put(`${API_BASE}/agents/${agentId}`, {
        llmConfigId: modelId
      });
      console.log('✅ Agent updated:', updateAgentResponse.data);
    }

    // 8. Создание чата
    if (agentsResponse.data.length > 0) {
      const agentId = agentsResponse.data[0].id;
      console.log(`\n8. Creating chat with agent ${agentId}...`);
      
      const createChatResponse = await axios.post(`${API_BASE}/chats`, {
        agentId: agentId,
        name: "Test Chat"
      });
      console.log('✅ Chat created:', createChatResponse.data);

      // 9. Отправка сообщения
      if (modelsResponse.data.length > 0) {
        const chatId = createChatResponse.data.id;
        console.log(`\n9. Sending message to chat ${chatId}...`);
        
        try {
          const sendMessageResponse = await axios.post(`${API_BASE}/chats/${chatId}/messages`, {
            content: "Hello! This is a test message."
          });
          console.log('✅ Message sent:', sendMessageResponse.data);
        } catch (error) {
          console.log('❌ Message send failed:', error.response?.data || error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testAPI();
