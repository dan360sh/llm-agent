const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testMCP() {
  console.log('🚀 Testing MCP functionality...\n');

  try {
    // Импортируем MCP конфигурацию
    console.log('1. Importing MCP configuration...');
    const mcpConfig = {
      "mcpServers": {
        "sequential-thinking": {
          "command": "npx",
          "args": [
            "-y",
            "@modelcontextprotocol/server-sequential-thinking"
          ]
        },
        "filesystem": {
          "command": "npx",
          "args": [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "/"
          ]
        },
        "server-cmd": {
          "command": "node",
          "args": [
            "C:/mcp/PhialsBasement_CMD-MCP-Server/dist/index.js"
          ]
        },
        "browser-mcp": {
          "command": "npx",
          "args": [
            "@browsermcp/mcp"
          ]
        }
      }
    };

    const importResponse = await axios.post(`${API_BASE}/mcp/import-config`, mcpConfig);
    console.log('✅ MCP config imported:', importResponse.data);

    // Получаем список MCP серверов
    console.log('\n2. Getting MCP servers...');
    const serversResponse = await axios.get(`${API_BASE}/mcp`);
    console.log('✅ MCP servers:', serversResponse.data);

    // Пытаемся запустить один из серверов
    if (serversResponse.data.length > 0) {
      const serverId = serversResponse.data[0].id;
      console.log(`\n3. Starting MCP server ${serverId}...`);
      
      try {
        const startResponse = await axios.post(`${API_BASE}/mcp/${serverId}/start`);
        console.log('✅ Server started:', startResponse.data);

        // Даем серверу время запуститься
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Получаем инструменты
        console.log(`\n4. Getting tools from server ${serverId}...`);
        try {
          const toolsResponse = await axios.get(`${API_BASE}/mcp/${serverId}/tools`);
          console.log('✅ Tools:', toolsResponse.data);
        } catch (error) {
          console.log('❌ Getting tools failed:', error.response?.data || error.message);
        }

      } catch (error) {
        console.log('❌ Server start failed:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ MCP Test failed:', error.response?.data || error.message);
  }
}

testMCP();
