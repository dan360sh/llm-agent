import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LLM Agent API',
      version: '1.0.0',
      description: 'API для работы с LLM агентами, чатами и MCP серверами',
      contact: {
        name: 'API Support',
        email: 'support@llmagent.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        LLMConfig: {
          type: 'object',
          required: ['id', 'name', 'provider', 'config', 'supportsImages', 'enabled'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор модели',
              example: 'uuid-12345',
            },
            name: {
              type: 'string',
              description: 'Название модели',
              example: 'OpenRouter GPT-4O',
            },
            provider: {
              type: 'string',
              enum: ['openai', 'ollama'],
              description: 'Провайдер LLM',
              example: 'openai',
            },
            config: {
              oneOf: [
                { $ref: '#/components/schemas/OpenAIConfig' },
                { $ref: '#/components/schemas/OllamaConfig' },
              ],
              description: 'Конфигурация провайдера',
            },
            supportsImages: {
              type: 'boolean',
              description: 'Поддерживает ли модель изображения',
              example: true,
            },
            enabled: {
              type: 'boolean',
              description: 'Включена ли модель',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
          },
        },
        OpenAIConfig: {
          type: 'object',
          required: ['apiKey', 'baseURL', 'model'],
          properties: {
            apiKey: {
              type: 'string',
              description: 'API ключ',
              example: 'sk-...',
            },
            baseURL: {
              type: 'string',
              description: 'Базовый URL API',
              example: 'https://api.openai.com/v1',
            },
            model: {
              type: 'string',
              description: 'Название модели',
              example: 'gpt-4',
            },
            maxTokens: {
              type: 'number',
              description: 'Максимальное количество токенов',
              example: 4000,
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              description: 'Температура генерации',
              example: 0.7,
            },
            headers: {
              type: 'object',
              description: 'Дополнительные заголовки',
              additionalProperties: {
                type: 'string',
              },
            },
          },
        },
        OllamaConfig: {
          type: 'object',
          required: ['baseURL', 'model'],
          properties: {
            baseURL: {
              type: 'string',
              description: 'URL Ollama сервера',
              example: 'http://localhost:11434',
            },
            model: {
              type: 'string',
              description: 'Название модели',
              example: 'llava:7b',
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              description: 'Температура генерации',
              example: 0.7,
            },
            maxTokens: {
              type: 'number',
              description: 'Максимальное количество токенов',
              example: 3000,
            },
          },
        },
        Agent: {
          type: 'object',
          required: ['id', 'name', 'systemPrompt', 'llmConfigId'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор агента',
            },
            name: {
              type: 'string',
              description: 'Название агента',
              example: 'Default Assistant',
            },
            description: {
              type: 'string',
              description: 'Описание агента',
              example: 'Помощник общего назначения',
            },
            systemPrompt: {
              type: 'string',
              description: 'Системный промт',
              example: 'You are a helpful AI assistant.',
            },
            llmConfigId: {
              type: 'string',
              description: 'ID LLM модели',
            },
            mcpServerIds: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Список ID MCP серверов',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Chat: {
          type: 'object',
          required: ['id', 'name', 'agentId', 'messages'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор чата',
            },
            name: {
              type: 'string',
              description: 'Название чата',
              example: 'Мой чат',
            },
            agentId: {
              type: 'string',
              description: 'ID агента',
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Message',
              },
              description: 'Список сообщений',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Message: {
          type: 'object',
          required: ['id', 'role', 'content', 'timestamp'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор сообщения',
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant', 'system'],
              description: 'Роль отправителя',
            },
            content: {
              type: 'string',
              description: 'Содержимое сообщения',
              example: 'Привет! Как дела?',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Пути к изображениям',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            streaming: {
              type: 'boolean',
              description: 'Флаг потокового сообщения',
            },
          },
        },
        MCPServer: {
          type: 'object',
          required: ['id', 'name', 'command', 'args', 'enabled', 'status'],
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный идентификатор сервера',
            },
            name: {
              type: 'string',
              description: 'Название сервера',
              example: 'Filesystem',
            },
            command: {
              type: 'string',
              description: 'Команда запуска',
              example: 'npx',
            },
            args: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Аргументы команды',
              example: ['-y', '@modelcontextprotocol/server-filesystem', '/'],
            },
            enabled: {
              type: 'boolean',
              description: 'Включен ли сервер',
            },
            status: {
              type: 'string',
              enum: ['running', 'stopped', 'error'],
              description: 'Статус сервера',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateChatRequest: {
          type: 'object',
          required: ['agentId'],
          properties: {
            agentId: {
              type: 'string',
              description: 'ID агента для чата',
            },
            name: {
              type: 'string',
              description: 'Название чата (опционально)',
              example: 'Новый чат',
            },
          },
        },
        SendMessageRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'Текст сообщения',
              example: 'Привет! Расскажи о погоде.',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Пути к изображениям',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Успешность операции',
            },
            message: {
              type: 'string',
              description: 'Сообщение о результате',
            },
            data: {
              description: 'Данные ответа',
            },
            error: {
              type: 'string',
              description: 'Сообщение об ошибке',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Сообщение об ошибке',
              example: 'Resource not found',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Детали ошибки',
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Ресурс не найден',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        BadRequest: {
          description: 'Неверный запрос',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Внутренняя ошибка сервера',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Проверка состояния API',
      },
      {
        name: 'LLM Models',
        description: 'Управление LLM моделями',
      },
      {
        name: 'Agents',
        description: 'Управление агентами',
      },
      {
        name: 'Chats',
        description: 'Управление чатами и сообщениями',
      },
      {
        name: 'MCP Servers',
        description: 'Управление MCP серверами',
      },
      {
        name: 'Upload',
        description: 'Загрузка файлов',
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/app.ts'], // пути к файлам с комментариями
};

export const specs = swaggerJsdoc(options);
